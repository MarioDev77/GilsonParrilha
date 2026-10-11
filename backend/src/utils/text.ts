// Controles, zero-width e marcadores bidirecionais (podem esconder ou inverter texto na mensagem).
const UNSAFE_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

// Texto livre vindo do cliente vira UMA linha limpa: sem quebras de linha, sem caracteres invisíveis.
// Impede, por exemplo, que uma observação injete linhas falsas ("Total: R$ 0,01") na mensagem do WhatsApp.
export function cleanText(value: string): string {
  return value.normalize('NFC').replace(UNSAFE_CHARS, ' ').replace(/\s+/g, ' ').trim();
}
