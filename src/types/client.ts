/** Per-client (tenant) configuration. Everything business-specific lives here, never in components. */
export interface ClientConfig {
  code: string
  businessName: string
  shortName: string
  tagline: string
  logo: string
  favicon: string
  locale: string
  contact: {
    phone?: string
    phoneSecondary?: string
    whatsapp?: string
    whatsappDisplay?: string
    email?: string
    addressLines?: string[]
    locality?: string
    openingHours?: string
    map?: { lat: number; lng: number; zoom?: number }
  }
  ordering: {
    currency: string
    /** All money values are integer cents (sen). */
    minimumOrder: number
    deliveryFee: number
    freeDeliveryFrom?: number
    allowWhatsappOrder: boolean
    referencePrefix: string
    quantityDiscounts: QuantityDiscount[]
    paymentOptions: string[]
  }
  branding: {
    primaryColor?: string
    primaryDark?: string
    primarySoft?: string
    accentColor?: string
    heroFrom?: string
    heroTo?: string
    /** Short brand word printed on generated packshots. */
    packshotBrand?: string
  }
  seo: {
    title: string
    description: string
    ogImage?: string
  }
  /** Customer-facing marketing copy. Keep in config so components stay generic. */
  copy: {
    welcomeFallback: string
    welcomeHeadline: string
    welcomeText: string
    heroPill: string
    heroHeadline: string
    heroHeadlineAccent: string
    heroText: string
    helpTitle: string
    helpText: string
    sidebarHelpTitle: string
    sidebarHelpText: string
    whatsappGreeting: string
    locationHeadline: string
    locationText: string
    catalogueNote: string
  }
}

export interface QuantityDiscount {
  minQty: number
  /** Fraction, e.g. 0.02 = 2 % off the base unit price. */
  rate: number
}
