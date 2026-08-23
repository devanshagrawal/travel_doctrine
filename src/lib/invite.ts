import { notify } from './confirm';

// The join link for a pending invite (its member-row id is the token). Uses the
// current origin so it works on localhost and the deployed site alike.
export function buildInviteUrl(memberId: string): string {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  return `${origin}/join/${memberId}`;
}

// Share via the OS share sheet when available (WhatsApp/Messages/etc.), else
// copy to the clipboard. Web-first — the app ships as a webview/PWA.
export async function shareInvite(memberId: string, tripName: string, email: string): Promise<void> {
  const url = buildInviteUrl(memberId);
  const text = `Join my "${tripName}" trip on Wander. Open this link and sign in with ${email}: ${url}`;
  const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;

  try {
    if (nav?.share) {
      await nav.share({ title: 'Wander trip invite', text, url });
      return;
    }
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(url);
      notify('Invite link copied', `Send it to ${email}. They must sign in with that email to join.`);
      return;
    }
  } catch {
    // user cancelled the share sheet, or share/clipboard unavailable — fall through
  }
  notify('Invite link', url);
}
