const guaraniNumberFormatter = new Intl.NumberFormat('es-PY', {
  maximumFractionDigits: 0,
});

export function formatGuaranies(amount: number): string {
  return `Gs. ${guaraniNumberFormatter.format(amount)}`;
}
