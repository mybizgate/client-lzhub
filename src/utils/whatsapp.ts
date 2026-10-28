/** Builds a click-to-chat URL. `number` is digits only with country code (e.g. 60123456789). */
export function whatsappUrl(number: string, text: string): string {
  const digits = number.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
