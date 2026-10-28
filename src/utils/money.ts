let formatter: Intl.NumberFormat | null = null

export function formatMoney(cents: number, locale = 'en-MY', currency = 'MYR'): string {
  if (!formatter || formatter.resolvedOptions().currency !== currency) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  // Keep the compact "RM1,234.50" look of the original site.
  return formatter.format(Number(cents) / 100).replace(/^MYR\s?/, 'RM').replace(/\s/g, '')
}

export function fromRinggit(value: string | number): number {
  return Math.round(Number(value) * 100)
}
