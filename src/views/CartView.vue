<script setup lang="ts">
import AppIcon from '../components/common/AppIcon.vue'
import PageHead from '../components/common/PageHead.vue'
import EmptyState from '../components/common/EmptyState.vue'
import CartLine from '../components/cart/CartLine.vue'
import OrderSummary from '../components/cart/OrderSummary.vue'
import MinimumBox from '../components/cart/MinimumBox.vue'
import { useCartStore } from '../stores/cart'
import { useCatalogueStore } from '../stores/catalogue'
import { useUiStore } from '../stores/ui'
import { useClient } from '../composables/useClient'
import { useHead } from '../composables/useHead'

const cart = useCartStore()
const catalogue = useCatalogueStore()
const ui = useUiStore()
const { config, money } = useClient()
useHead({ title: 'Troli pesanan' })

function clear() {
  if (window.confirm('Kosongkan semua barang dalam troli?')) cart.clear()
}
function repair() {
  cart.repair()
  ui.toast('Troli diselaraskan kepada stok dan minimum terkini.')
}
const tiers = () => config.value.ordering.quantityDiscounts
</script>

<template>
  <template v-if="catalogue.status === 'loading'">
    <PageHead title="Troli pesanan" />
    <div class="h-40 animate-pulse rounded-2xl border border-line bg-white" />
  </template>
  <template v-else-if="!cart.entries.length">
    <PageHead title="Troli pesanan" description="Kumpul stok kedai anda di sini." />
    <EmptyState title="Troli anda masih kosong" description="Pilih barangan mengikut kategori dan tambah kuantiti borong.">
      <RouterLink :to="{ name: 'catalogue' }" class="btn-primary"><AppIcon name="grid" />Mula pilih barang</RouterLink>
    </EmptyState>
  </template>
  <template v-else>
    <PageHead title="Troli pesanan" :description="`${cart.entries.length} jenis produk • ${cart.count} unit borong`">
      <button type="button" class="btn-ghost !text-[#a15140]" @click="clear"><AppIcon name="trash" /><span class="hidden md:inline">Kosongkan</span></button>
    </PageHead>
    <div class="flex flex-col gap-[17px] md:grid md:grid-cols-2 md:items-start md:gap-[15px] xl:grid-cols-[minmax(0,1.5fr)_minmax(295px,1fr)] xl:gap-[21px]">
      <section class="panel !px-[15px] !pb-[14px] !pt-[3px] md:!px-4 xl:!px-[23px] xl:!pb-[17px] xl:!pt-[6px]">
        <div v-if="cart.issues.length" class="validation-error">
          Stok atau syarat telah berubah. Sila semak:<br />
          <template v-for="i in cart.issues" :key="i">{{ i }}<br /></template>
          <button type="button" class="btn-link !text-[11px] underline" @click="repair">Laraskan kepada stok tersedia</button>
        </div>
        <CartLine v-for="e in cart.entries" :key="e.product.id" :entry="e" />
        <RouterLink :to="{ name: 'catalogue' }" class="btn-link mt-[14px] !min-h-[40px]"><AppIcon name="arrow" class="h-[17px] w-[17px] rotate-180" /> Tambah barangan lain</RouterLink>
      </section>
      <aside>
        <div class="panel !p-[22px] md:!p-5 xl:!p-[23px] xl:sticky xl:top-[97px]">
          <h3 class="mb-[18px] text-[17px] font-extrabold">Ringkasan pesanan</h3>
          <MinimumBox />
          <OrderSummary :subtotal="cart.subtotal" :savings="cart.savings" :fee="cart.deliveryFee('delivery')" />
          <RouterLink v-if="cart.meetsMinimum && !cart.issues.length" :to="{ name: 'checkout' }" class="btn-primary w-full !min-h-[48px]">Semak &amp; teruskan <AppIcon name="arrow" /></RouterLink>
          <button v-else type="button" class="btn-primary w-full !min-h-[48px]" disabled>Semak &amp; teruskan <AppIcon name="arrow" /></button>
          <p class="hint mt-3">
            Caj penghantaran anggaran {{ money(config.ordering.deliveryFee) }}<template v-if="config.ordering.freeDeliveryFrom">, percuma mulai {{ money(config.ordering.freeDeliveryFrom) }}</template>. Ambil sendiri tanpa caj. Harga akhir disahkan pembekal.
          </p>
          <div class="mt-3 flex items-center gap-2 border-t border-line pt-[13px] text-[11px] text-[#75856f]"><AppIcon name="shield" class="h-[15px] w-[15px]" /> Tiada bayaran diproses di sini.</div>
        </div>
        <div v-if="tiers().length" class="mt-[15px] rounded-xl border border-dashed border-[#ccdac5] px-5 py-4 text-[12px]">
          <b>Jimat bila beli lebih</b>
          <p class="my-[7px] text-[11px] leading-[1.8]"><template v-for="(t, i) in tiers()" :key="t.minQty">{{ i < tiers().length - 1 ? `${t.minQty}-${tiers()[i + 1]!.minQty - 1}` : `${t.minQty}+` }} unit: diskaun {{ Math.round(t.rate * 100) }}%<br /></template></p>
          <small class="text-[10px] text-muted">Dikira bagi setiap produk, bukan jumlah troli.</small>
        </div>
      </aside>
    </div>
  </template>
</template>
