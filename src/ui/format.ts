/** Size-tier labels: 1-tall modules read as shirt sizes, tall ones as W×H. */
const TIER: Record<number, string> = { 1: 'S', 2: 'M', 3: 'L', 4: 'XL', 5: 'XL', 6: 'XXL' };

export function sizeLabel(w: number, h: number): string {
  return h === 1 ? (TIER[w] ?? `${w}×${h}`) : `${w}×${h}`;
}
