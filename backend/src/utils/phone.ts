// Normaliza número de WhatsApp para o formato exigido pelo link wa.me: só dígitos, com DDI.
// Entradas aceitas: "(75) 99999-9999", "+55 75 99999-9999", "5575999999999".
// Números de 10/11 dígitos são tratados como brasileiros (DDD + número) e recebem o DDI 55.
export function normalizeWhatsappNumber(input: string): string | null {
  let digits = input.replace(/\D/g, '').replace(/^0+/, '');

  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;

  if (digits.startsWith('55')) {
    return digits.length === 12 || digits.length === 13 ? digits : null;
  }
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}
