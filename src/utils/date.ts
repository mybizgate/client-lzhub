export function dateISO(daysFromToday = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function humanDate(iso: string, locale = 'ms-MY'): string {
  if (!iso) return ''
  const value = iso.length === 10 ? `${iso}T12:00:00` : iso
  return new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}
