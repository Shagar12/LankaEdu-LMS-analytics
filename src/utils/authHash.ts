/**
 * Authentication Hash utilities for LankaEdu LMS
 * Computes deterministic SHA-256 hex string representation of administrator passwords
 * and provides mobile device session detection.
 */

export async function computeSha256Hash(password: string): Promise<string> {
  const normalized = (password || '').trim();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(normalized);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Crypto subtle digest failed, using synchronous fallback:', e);
    }
  }
  return computeSyncHash(normalized);
}

export function computeSyncHash(str: string): string {
  const normalized = (str || '').trim();
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'lkhash_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * Checks if current device is a mobile browser / phone / tablet
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const mobileRegex = /android|avantgo|blackberry|iemobile|ipad|iphone|ipod|opera mini|opera mobi|palm|phone|pocket|symbian|up\.browser|up\.link|wap|windows ce|windows phone/i;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  return mobileRegex.test(userAgent) || (isTouch && isSmallScreen);
}
