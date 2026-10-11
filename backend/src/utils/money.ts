// Formata centavos inteiros como "R$ 1.234,56" sem depender de ICU/Intl (saída idêntica em qualquer servidor).
export function formatBRL(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const reais = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavos = String(abs % 100).padStart(2, '0');
  return `${negative ? '-' : ''}R$ ${reais},${centavos}`;
}
