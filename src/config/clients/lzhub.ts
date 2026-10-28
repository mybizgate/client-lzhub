import type { ClientConfig } from '../../types/client'

/**
 * Lz Success Enterprise (slug: lzhub). Business facts mirror site.config.yml, which the
 * MyBizGate platform tooling still reads for hosting/DNS metadata.
 */
export const lzhub: ClientConfig = {
  code: 'lzhub',
  businessName: 'Lz Success Enterprise',
  shortName: 'Lz Success Ent.',
  tagline: 'Pengedar Produk IKS Tempatan',
  logo: '/images/logo.png',
  favicon: '/fav.ico',
  locale: 'ms-MY',
  contact: {
    phone: '+60192857371',
    phoneSecondary: '+60175050885',
    whatsapp: '60192857371',
    whatsappDisplay: '+60 19-285 7371',
    email: 'lzsuccess007@gmail.com',
    addressLines: ['27 Jalan Melati 13,', 'Taman Melati,', '53100 Kuala Lumpur'],
    locality: 'Taman Melati, Kuala Lumpur',
    openingHours: '8am - 6pm',
    map: { lat: 3.2263321097269, lng: 101.72388916758418, zoom: 16 },
  },
  ordering: {
    currency: 'MYR',
    minimumOrder: 15000,
    deliveryFee: 1500,
    freeDeliveryFrom: 50000,
    allowWhatsappOrder: true,
    referencePrefix: 'LZ',
    quantityDiscounts: [
      { minQty: 5, rate: 0.02 },
      { minQty: 10, rate: 0.04 },
    ],
    paymentOptions: ['Tunai semasa terima barang', 'Pindahan bank selepas disahkan'],
  },
  branding: {
    primaryColor: '#176f51',
    primaryDark: '#104c3b',
    primarySoft: '#e9f3ec',
    accentColor: '#edba63',
    heroFrom: '#11553e',
    heroTo: '#206e4e',
    packshotBrand: 'LZ SUCCESS',
  },
  seo: {
    title: 'Lz Success Enterprise | Pengedar Produk IKS Tempatan',
    description:
      'Lz Success Enterprise - pengedar produk IKS tempatan di Taman Melati, Kuala Lumpur. Katalog borong, harga terkini dan pesanan melalui WhatsApp dalam satu tempat.',
    ogImage: '/images/logo.png',
  },
  copy: {
    welcomeFallback: 'RAKAN RUNCIT',
    welcomeHeadline: 'Stok cukup. Bisnes lancar.',
    welcomeText: 'Bekalan dapur untuk kedai anda, tanpa belek katalog.',
    heroPill: 'HARGA BORONG, BUKAN RUNCIT',
    heroHeadline: 'Isi semula stok.',
    heroHeadlineAccent: 'Lebih mudah.',
    heroText: 'Karton, guni dan pek pukal.\nLebih banyak beli, lebih banyak jimat.',
    helpTitle: 'Tak jumpa barang yang dicari?',
    helpText: 'Tanya kami. Kita cari bekalan yang sesuai untuk kedai anda.',
    sidebarHelpTitle: 'Rakan borong kedai anda.',
    sidebarHelpText: 'Perlukan bantuan dengan stok atau pesanan? Bincang terus dengan kami.',
    whatsappGreeting: 'Salam Lz Success Enterprise.',
    locationHeadline: 'Taman Melati, Kuala Lumpur',
    locationText: 'Gunakan pin tepat ini untuk merancang pengambilan atau membuka panduan arah pada telefon anda.',
    catalogueNote: 'Harga dan stok dikemas kini oleh pembekal. Harga akhir disahkan semasa pesanan.',
  },
}
