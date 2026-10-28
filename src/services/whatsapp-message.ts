import type { ClientConfig } from '../types/client'
import type { Order } from '../types/order'
import { formatMoney } from '../utils/money'
import { humanDate } from '../utils/date'

/** Plain-text order request for WhatsApp. Encoding happens in whatsappUrl(). */
export function orderMessage(order: Order, config: ClientConfig): string {
  const money = (c: number) => formatMoney(c, config.locale, config.ordering.currency)
  const lines = order.items.map(
    (i, n) =>
      `${n + 1}. ${i.name} ${i.size}\n   ${i.qty} ${i.unit} (${i.packQty} x ${i.size}/${i.unit}) x ${money(i.unitPrice)} = ${money(i.qty * i.unitPrice)}`,
  )
  return [
    `*${config.businessName} | PERMINTAAN PESANAN*`,
    `Rujukan: ${order.id}`,
    '',
    `Kedai: ${order.customer.storeName}`,
    `Nama: ${order.customer.contactName}`,
    `Telefon: ${order.customer.phone}`,
    '',
    lines.join('\n\n'),
    '',
    `Subtotal: ${money(order.subtotal)}`,
    `Penghantaran (anggaran): ${money(order.deliveryFee)}`,
    `*Anggaran jumlah: ${money(order.total)}*`,
    `Kaedah: ${order.fulfilment === 'pickup' ? 'Ambil sendiri' : 'Penghantaran'}`,
    `Alamat: ${order.customer.address || 'Ambil sendiri - lokasi disahkan pembekal'}`,
    `Tarikh diminta: ${humanDate(order.requestedDate, config.locale)}`,
    `Bayaran: ${order.paymentMethod}`,
    `Nota: ${order.notes || '-'}`,
    '',
    'Mohon sahkan stok, harga akhir dan tarikh. Ini permintaan pesanan, bukan pengesahan bayaran.',
  ].join('\n')
}

export function enquiryMessage(config: ClientConfig, subject?: string): string {
  return subject
    ? `${config.copy.whatsappGreeting} Saya ingin bertanya tentang ${subject}.`
    : `${config.copy.whatsappGreeting} Saya ingin bertanya tentang bekalan barangan borong.`
}
