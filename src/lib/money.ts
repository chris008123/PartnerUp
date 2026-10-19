export const formatGHS = (pesewas: number) =>
  'GH₵ ' + (pesewas / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function toPesewas(input: string): number {
  const n = parseFloat(input.replace(/,/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 100);
}
