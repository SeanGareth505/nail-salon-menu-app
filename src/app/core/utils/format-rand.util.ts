export function formatRand(amount: number): string {
  return 'R' + String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
