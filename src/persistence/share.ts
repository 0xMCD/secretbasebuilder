/**
 * Share codes: the whole base compressed into a URL hash (#b=<code>).
 * No backend — the link IS the base. deflate-raw via CompressionStream where
 * available (all modern browsers), with a plain-JSON fallback prefix.
 */
import type { SaveFile } from '../core/types';

const PREFIX_DEFLATE = 'c';
const PREFIX_PLAIN = 'j';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const readable = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(readable).arrayBuffer());
}

export async function encodeShare(save: SaveFile): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(save));
  if (typeof CompressionStream !== 'undefined') {
    return PREFIX_DEFLATE + toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')));
  }
  return PREFIX_PLAIN + toBase64Url(bytes);
}

/** Returns the decoded save JSON string. Throws on garbage. */
export async function decodeShare(code: string): Promise<string> {
  const prefix = code[0];
  const bytes = fromBase64Url(code.slice(1));
  if (prefix === PREFIX_DEFLATE) {
    const out = await pipe(bytes, new DecompressionStream('deflate-raw'));
    return new TextDecoder().decode(out);
  }
  if (prefix === PREFIX_PLAIN) return new TextDecoder().decode(bytes);
  throw new Error(`Unknown share code prefix: ${prefix}`);
}

/** Builds the full shareable URL for the current page. */
export function shareUrl(code: string): string {
  return `${location.origin}${location.pathname}${location.search}#b=${code}`;
}

/** Extracts a share code from a URL hash, if present. */
export function shareCodeFromHash(hash: string): string | null {
  const m = /#b=([A-Za-z0-9\-_]+)/.exec(hash);
  return m ? m[1] : null;
}

/** Type guard so callers can lean on deserialize() for sanitizing. */
export function looksLikeSave(json: string): boolean {
  try {
    const v = JSON.parse(json) as Partial<SaveFile>;
    return typeof v === 'object' && v !== null && 'version' in v;
  } catch {
    return false;
  }
}
