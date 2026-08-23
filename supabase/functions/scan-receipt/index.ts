// Supabase Edge Function: scan-receipt
// Triggered by a Database Webhook on INSERT into `expenses`. For a pending row
// with a receipt image, it runs OCR via Gemini and fills the expense fields.
// The row stays `pending` — a trip member still approves it in the app.
//
// Deploy:
//   supabase functions deploy scan-receipt --no-verify-jwt
//   supabase secrets set GEMINI_API_KEY=your_key
//   supabase secrets set SCAN_WEBHOOK_SECRET=some_random_string   (optional)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('SCAN_WEBHOOK_SECRET'); // optional shared secret
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const CATEGORIES = ['Flights', 'Stay', 'Food', 'Transport', 'Activities', 'Shopping'];

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
      return new Response('unauthorized', { status: 401 });
    }

    const body = await req.json();
    const row = body.record ?? body; // DB webhook sends { record }
    if (!row?.id || row.status !== 'pending' || !row.receipt_uri) {
      return new Response('skip', { status: 200 });
    }

    // 1) fetch the receipt image
    const imgResp = await fetch(row.receipt_uri);
    const mime = imgResp.headers.get('content-type') ?? 'image/jpeg';
    const buf = new Uint8Array(await imgResp.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const base64 = btoa(bin);

    // 2) ask Gemini to extract structured fields
    const prompt =
      `You are a receipt parser. From this receipt image extract: the total amount paid, ` +
      `the 3-letter ISO currency code, the merchant name, the purchase date (YYYY-MM-DD), and ` +
      `the single best-fit category from this list: ${CATEGORIES.join(', ')} (or null if unclear).`;

    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            merchant: { type: 'STRING' },
            amount: { type: 'NUMBER' },
            currency: { type: 'STRING' },
            date: { type: 'STRING' },
            category: { type: 'STRING', nullable: true },
          },
        },
      },
    });

    // Gemini flash is often briefly overloaded (503) — retry with backoff.
    let text = '';
    for (let attempt = 1; attempt <= 4; attempt++) {
      const gemResp = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_KEY },
        body: payload,
      });
      if (gemResp.status === 503 || gemResp.status === 429) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }
      const gem = await gemResp.json();
      text = gem?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      break;
    }
    if (!text) return new Response('ocr-unavailable', { status: 200 }); // leave row pending, don't clobber
    const parsed = JSON.parse(text);

    // 3) map the category guess to one of the trip's budget categories
    let categoryId: string | null = null;
    if (parsed.category) {
      const { data: cats } = await admin
        .from('budget_categories')
        .select('id,name')
        .eq('trip_id', row.trip_id);
      const hit = (cats ?? []).find(
        (c: { name: string }) => c.name.toLowerCase() === String(parsed.category).toLowerCase(),
      );
      categoryId = hit?.id ?? null;
    }

    // 4) update the pending expense (still pending — awaits human approval)
    await admin
      .from('expenses')
      .update({
        description: parsed.merchant ? String(parsed.merchant).slice(0, 120) : 'Scanned receipt',
        amount: Number(parsed.amount) || 0,
        currency: (parsed.currency && String(parsed.currency).length === 3
          ? String(parsed.currency).toUpperCase()
          : row.currency),
        spent_at: /^\d{4}-\d{2}-\d{2}$/.test(parsed.date ?? '') ? parsed.date : row.spent_at,
        category_id: categoryId,
      })
      .eq('id', row.id)
      .eq('status', 'pending'); // don't clobber if already approved

    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('scan-receipt error', e);
    return new Response('error', { status: 200 }); // 200 so the webhook doesn't retry-storm
  }
});
