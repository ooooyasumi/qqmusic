import type { Room } from './types';

function tokenFromLink(link: string): string | null {
  try {
    const url = new URL(link);
    return url.searchParams.get('challenge') ?? url.searchParams.get('room');
  } catch {
    return null;
  }
}

export function shareLinkForRoom(room: Pick<Room, 'id' | 'link' | 'shareToken'>): string {
  const token = room.shareToken ?? tokenFromLink(room.link) ?? room.id;
  if (typeof window === 'undefined') return room.link;
  return `${window.location.origin}${window.location.pathname}?challenge=${encodeURIComponent(token)}`;
}

export function homeLinkForShare(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}`;
}

export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the selection-based copy path for mobile HTTP browsers.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
