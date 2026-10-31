<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import type { ManagedProduct, ProductInput } from '../../types/product'
import ProductArt from '../common/ProductArt.vue'
import { manageService } from '../../services/manage.service'
import { useCatalogueStore } from '../../stores/catalogue'
import { useUiStore } from '../../stores/ui'
import { HttpError } from '../../services/http'
import { parseMoney, toMoneyInput } from '../../utils/money'

const props = defineProps<{ product?: ManagedProduct }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()
const catalogue = useCatalogueStore()
const ui = useUiStore()

const form = reactive({
  categoryId: props.product?.categoryId ?? '',
  name: props.product?.name ?? '',
  packing: props.product ? `${props.product.packQty} x ${props.product.size} / ${props.product.unit}` : '',
  price: props.product ? toMoneyInput(props.product.price) : '',
  oldPrice: props.product?.oldPrice ? toMoneyInput(props.product.oldPrice) : '',
  stock: String(props.product?.stockQuantity ?? 0),
  unlimitedStock: props.product?.unlimitedStock ?? false,
  minimumQuantity: String(props.product?.minimumQuantity ?? 1),
  active: props.product ? props.product.status === 'active' : true,
})
const error = ref('')
const saving = ref(false)
const newCategory = ref('')
const addingCategory = ref(false)
const categorySaving = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const objectUrl = ref('')

const packingPattern = /^\s*(\d+)\s*[x×X]\s*(\S+)\s*\/\s*(\S+)\s*$/
const parsedPacking = computed(() => packingPattern.exec(form.packing))
const unitLabel = computed(() => parsedPacking.value?.[3] ?? props.product?.unit ?? 'unit')
const priceCents = computed(() => parseMoney(form.price))
const oldPriceCents = computed(() => form.oldPrice.trim() ? parseMoney(form.oldPrice) : null)
const discount = computed(() => {
  const price = priceCents.value
  const oldPrice = oldPriceCents.value
  return price !== null && oldPrice !== null && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0
})
const previewProduct = computed<ManagedProduct>(() => ({
  ...(props.product ?? {
    id: 'preview',
    name: form.name || 'Produk baharu',
    slug: 'preview',
    categoryId: form.categoryId,
    images: [],
    unit: unitLabel.value,
    packQty: Number(parsedPacking.value?.[1] ?? 1),
    size: parsedPacking.value?.[2] ?? '',
    price: priceCents.value ?? 0,
    minimumQuantity: 1,
    stock: 0,
    stockStatus: 'out',
    active: true,
    status: 'active',
    sortOrder: 0,
    stockQuantity: 0,
    unlimitedStock: false,
    lowStockThreshold: 10,
    featured: false,
  }),
  images: objectUrl.value ? [objectUrl.value] : [...(props.product?.images ?? [])],
}))
const hasImage = computed(() => previewProduct.value.images.length > 0)

function chooseFile() {
  fileInput.value?.click()
}

function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
  selectedFile.value = file
  objectUrl.value = URL.createObjectURL(file)
}

async function saveCategory() {
  const name = newCategory.value.trim()
  if (name.length < 2) {
    error.value = 'Nama kategori mesti sekurang-kurangnya 2 aksara.'
    return
  }
  categorySaving.value = true
  error.value = ''
  try {
    const category = await manageService.createCategory({ name, status: 'active' })
    catalogue.addCategory(category)
    form.categoryId = category.id
    newCategory.value = ''
    addingCategory.value = false
  } catch (caught) {
    error.value = messageFor(caught)
  } finally {
    categorySaving.value = false
  }
}

function validate(): ProductInput | null {
  if (!form.categoryId || form.categoryId === '__new__') return fail('Kategori diperlukan.')
  const name = form.name.trim()
  if (name.length < 2 || name.length > 200) return fail('Nama produk mesti antara 2 hingga 200 aksara.')
  const packing = parsedPacking.value
  if (!packing) return fail('Pembungkusan mesti seperti 12 x 1kg / karton.')
  const price = parseMoney(form.price)
  if (price === null || price <= 0) return fail('Harga mesti lebih daripada RM0.00.')
  const oldPrice = form.oldPrice.trim() ? parseMoney(form.oldPrice) : null
  if (form.oldPrice.trim() && (oldPrice === null || oldPrice <= price)) return fail('Harga asal mesti lebih tinggi daripada harga jualan.')
  const stock = Number(form.stock)
  if (!form.unlimitedStock && (!Number.isInteger(stock) || stock < 0)) return fail('Stok mesti nombor bulat 0 atau lebih.')
  const minimum = Number(form.minimumQuantity)
  if (!Number.isInteger(minimum) || minimum < 1) return fail('Pesanan minimum mesti nombor bulat sekurang-kurangnya 1.')
  error.value = ''
  return {
    categoryId: form.categoryId,
    name,
    slug: props.product?.slug,
    sku: props.product?.sku ?? null,
    description: props.product?.description ?? null,
    brand: props.product?.brand ?? null,
    unit: packing[3]!,
    packQty: Number(packing[1]),
    size: packing[2]!,
    price,
    oldPrice,
    minimumQuantity: minimum,
    stockQuantity: form.unlimitedStock ? (props.product?.stockQuantity ?? 0) : stock,
    unlimitedStock: form.unlimitedStock,
    status: form.active ? 'active' : 'draft',
    sortOrder: props.product?.sortOrder,
    featured: props.product?.featured ?? false,
  }
}

function fail(message: string): null {
  error.value = message
  return null
}

async function save() {
  const input = validate()
  if (!input) return
  saving.value = true
  try {
    const result = props.product
      ? await manageService.updateProduct(props.product.id, input)
      : await manageService.createProduct(input)
    if (selectedFile.value) {
      const imageUrl = await manageService.setPrimaryImage(result.id, selectedFile.value)
      result.images = [imageUrl, ...result.images.slice(1)]
    }
    await catalogue.loadManageable()
    catalogue.upsertProduct(result)
    ui.toast('Produk disimpan.')
    emit('saved')
  } catch (caught) {
    error.value = messageFor(caught)
  } finally {
    saving.value = false
  }
}

function messageFor(caught: unknown): string {
  if (caught instanceof HttpError && caught.body && typeof caught.body === 'object') {
    const body = caught.body as { errors?: Record<string, string[]>; message?: string }
    const first = body.errors ? Object.values(body.errors).flat()[0] : undefined
    return first ?? body.message ?? caught.message
  }
  return caught instanceof Error ? caught.message : 'Produk tidak dapat disimpan.'
}

onBeforeUnmount(() => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
})
</script>

<template>
  <form data-product-editor class="product-card relative col-span-2 min-w-0 overflow-hidden rounded-[13px] border border-brand/30 bg-white shadow-lift md:rounded-2xl" novalidate @submit.prevent="save">
    <fieldset :disabled="saving">
      <div class="product-stage relative grid h-[183px] place-items-center p-4">
        <span v-if="discount" class="absolute left-[10px] top-[10px] z-[2] rounded-md bg-brand px-2 py-1 text-[10px] font-black text-white">-{{ discount }}%</span>
        <input ref="fileInput" type="file" accept="image/*" class="sr-only" @change="onFile" />
        <div v-if="hasImage" class="relative h-[151px] w-full">
          <ProductArt :product="previewProduct" img-class="mx-auto h-full w-auto" />
          <button type="button" class="absolute bottom-0 right-0 min-h-[44px] px-2 text-[11px] font-extrabold text-brand underline" @click="chooseFile">Tukar gambar</button>
        </div>
        <button v-else type="button" class="grid h-full w-full place-items-center rounded-xl border-2 border-dashed border-brand/35 text-brand" @click="chooseFile">
          <span><strong class="block text-[28px] leading-none">[+]</strong><span class="mt-2 block text-[12px] font-extrabold">Tambah gambar produk</span></span>
        </button>
      </div>
      <div class="p-[14px] md:p-5">
        <div class="field">
          <label :for="`category-${product?.id ?? 'new'}`">Kategori</label>
          <select :id="`category-${product?.id ?? 'new'}`" v-model="form.categoryId" @change="addingCategory = form.categoryId === '__new__'">
            <option value="" disabled>Pilih kategori</option>
            <option v-for="category in catalogue.categories" :key="category.id" :value="category.id">{{ category.name }}</option>
            <option value="__new__">+ Kategori baharu…</option>
          </select>
        </div>
        <div v-if="addingCategory" class="mb-4 flex items-end gap-2">
          <div class="field !mb-0 flex-1"><label :for="`new-category-${product?.id ?? 'new'}`">Kategori baharu</label><input :id="`new-category-${product?.id ?? 'new'}`" v-model="newCategory" type="text" /></div>
          <button type="button" class="btn-secondary shrink-0" :disabled="categorySaving" @click="saveCategory">Simpan kategori</button>
        </div>
        <div class="field">
          <label :for="`name-${product?.id ?? 'new'}`">Nama produk</label>
          <input :id="`name-${product?.id ?? 'new'}`" v-model="form.name" type="text" maxlength="200" placeholder="cth: Serbuk Kari Daging (saiz diisi di Pembungkusan)" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field"><label :for="`packing-${product?.id ?? 'new'}`">Pembungkusan</label><input :id="`packing-${product?.id ?? 'new'}`" v-model="form.packing" type="text" placeholder="12 x 1kg / karton" /></div>
          <div class="field"><label :for="`price-${product?.id ?? 'new'}`">Harga (RM)</label><input :id="`price-${product?.id ?? 'new'}`" v-model="form.price" type="text" inputmode="decimal" placeholder="145.20" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field"><label :for="`old-price-${product?.id ?? 'new'}`">Harga asal (RM)</label><input :id="`old-price-${product?.id ?? 'new'}`" v-model="form.oldPrice" type="text" inputmode="decimal" placeholder="159.00" /></div>
          <div class="field">
            <label :for="`stock-${product?.id ?? 'new'}`">Stok ({{ unitLabel }})</label>
            <input :id="`stock-${product?.id ?? 'new'}`" v-model="form.stock" type="number" min="0" step="1" :disabled="form.unlimitedStock" />
            <label class="!flex min-h-[44px] cursor-pointer items-center gap-2 !text-[11px] font-normal"><input v-model="form.unlimitedStock" type="checkbox" class="!h-[18px] !w-[18px] !min-h-0 shrink-0 !p-0 rounded border-line text-brand focus:ring-0" /> Tanpa had</label>
          </div>
        </div>
        <div class="grid grid-cols-2 items-end gap-3">
          <div class="field"><label :for="`minimum-${product?.id ?? 'new'}`">Pesanan minimum ({{ unitLabel }})</label><input :id="`minimum-${product?.id ?? 'new'}`" v-model="form.minimumQuantity" type="number" min="1" step="1" /></div>
          <button type="submit" class="btn-primary mb-4 w-full">{{ saving ? 'Menyimpan…' : '+ Simpan' }}</button>
        </div>
        <div v-if="error" class="validation-error" role="alert">{{ error }}</div>
        <div class="flex items-center justify-between gap-3">
          <label class="check-label !my-0"><input v-model="form.active" type="checkbox" /> Aktif</label>
          <button type="button" class="min-h-[44px] px-2 text-[12px] font-extrabold text-brand" @click="emit('cancel')">Batal</button>
        </div>
      </div>
    </fieldset>
  </form>
</template>
