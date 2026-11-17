export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below when Clipboard API is blocked by iframe policy
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export async function shareOrCopyLink(params: {
  title: string;
  text: string;
  url: string;
}): Promise<'shared' | 'copied' | 'manual'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: params.title,
        text: params.text,
        url: params.url,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        const copied = await copyTextToClipboard(params.url);
        return copied ? 'copied' : 'manual';
      }
      // Fallback to clipboard if Web Share failed (e.g. iframe restrictions)
    }
  }

  const copied = await copyTextToClipboard(params.url);
  return copied ? 'copied' : 'manual';
}

export function buildChallengeShareUrl(params: {
  challengeId: number;
  shareId?: string | null;
  playerName: string;
  countryCode: string;
  won?: boolean | null;
  pointsDelta?: number;
}): string {
  const url = new URL(window.location.origin);
  url.searchParams.set('defi', String(params.challengeId));
  if (params.shareId) {
    url.searchParams.set('share', params.shareId);
  }
  if (params.playerName) {
    url.searchParams.set('by', params.playerName.slice(0, 24));
  }
  if (params.countryCode) {
    url.searchParams.set('pays', params.countryCode);
  }
  if (typeof params.won === 'boolean') {
    url.searchParams.set('won', params.won ? '1' : '0');
  }
  if (typeof params.pointsDelta === 'number' && params.pointsDelta !== 0) {
    url.searchParams.set('pts', String(Math.round(params.pointsDelta)));
  }
  return url.toString();
}

export function buildDuelRoomShareUrl(roomId: string): string {
  const url = new URL(window.location.origin);
  url.searchParams.set('room', roomId.trim().toUpperCase());
  return url.toString();
}
