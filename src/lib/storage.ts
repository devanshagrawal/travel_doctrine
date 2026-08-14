import { supabase } from './supabase';

// Buckets created by the migration: 'covers' is public (stable public URLs),
// 'documents' is private (owner-only; we mint a long-lived signed URL).
type Bucket = 'covers' | 'documents';

function extFromType(t?: string): string {
  const e = (t ?? '').split('/')[1];
  return e === 'jpeg' ? 'jpg' : e || 'jpg';
}

// Upload a locally-picked image (blob:/data:/file: URI) to a bucket and return
// a URL that <Image source={{ uri }} /> can render directly.
export async function uploadImage(bucket: Bucket, localUri: string): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) throw new Error('Not signed in.');

  const blob = await (await fetch(localUri)).blob();
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extFromType(blob.type)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
  if (error) throw error;

  if (bucket === 'covers') {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const { data, error: sErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365); // ~1 year
  if (sErr) throw sErr;
  return data.signedUrl;
}

// Pass-through for already-remote URLs; upload local ones. Lets callers
// hand us whatever the picker returned without checking themselves.
export async function ensureRemote(uri: string | undefined, bucket: Bucket): Promise<string | undefined> {
  if (!uri) return undefined;
  if (/^https?:\/\//.test(uri)) return uri;
  return uploadImage(bucket, uri);
}
