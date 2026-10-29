<script setup lang="ts">
/**
 * Development/test utility for the MyBizGate Media API. Business data still goes to
 * client-api (VITE_API_BASE_URL); every file/media operation on this page uses
 * media-api (VITE_MEDIA_API_BASE_URL) through src/services/media.service.ts.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { env } from '@/config/env'
import { mediaApi, type MediaItem, type MediaVisibility } from '@/services/media.service'

const CLIENT_API_BASE_URL = env.apiBaseUrl
const MEDIA_API_BASE_URL = env.mediaApiBaseUrl
const CLIENT_CODE = env.clientCode

const selectedFile = ref<File | null>(null)
const originalPreviewUrl = ref<string | null>(null)

const module = ref('products')
const entityId = ref('TEST001')
const visibility = ref<MediaVisibility>('public')

const busy = ref<'' | 'upload' | 'download' | 'delete' | 'metadata'>('')
const media = ref<MediaItem | null>(null)
const metadataJson = ref('')

const errorMessage = ref('')
const successMessage = ref('')

// Cache-busting token so the preview refreshes after a replace.
const previewVersion = ref(0)

const originalSize = computed(() => (selectedFile.value ? formatBytes(selectedFile.value.size) : '-'))
const optimizedSize = computed(() => (media.value ? formatBytes(media.value.size_bytes) : '-'))

const savingPercent = computed(() => {
  if (!media.value || media.value.original_size_bytes === 0) return null
  return Math.max(0, Math.round((1 - media.value.size_bytes / media.value.original_size_bytes) * 100))
})

const previewUrl = computed(() => (media.value ? `${media.value.view_url}?v=${previewVersion.value}` : ''))
const thumbnailPreviewUrl = computed(() =>
  media.value?.thumbnail_url ? `${media.value.thumbnail_url}?v=${previewVersion.value}` : '',
)

const details = computed(() => {
  if (!media.value) return []
  const m = media.value
  return [
    ['Original filename', m.original_filename],
    ['Original size', formatBytes(m.original_size_bytes)],
    ['Stored format', m.format.toUpperCase()],
    ['Optimized size', formatBytes(m.size_bytes)],
    ['Compression saving', savingPercent.value === null ? '-' : `${savingPercent.value}%`],
    ['Dimensions', m.width && m.height ? `${m.width} x ${m.height}` : '-'],
    ['Media ID', m.id],
    ['Module', m.module],
    ['Entity ID', m.entity_id ?? '-'],
    ['Visibility', m.visibility],
    ['View URL', m.view_url],
    ['Thumbnail URL', m.thumbnail_url ?? '-'],
    ['Download URL', m.download_url],
  ] as Array<[string, string]>
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function fail(error: unknown, fallback: string) {
  console.error(error)
  errorMessage.value = error instanceof Error ? error.message : fallback
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  resetMessages()

  if (originalPreviewUrl.value) URL.revokeObjectURL(originalPreviewUrl.value)

  const file = input.files?.[0] ?? null
  selectedFile.value = file
  originalPreviewUrl.value = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null
}

async function upload() {
  resetMessages()
  if (!selectedFile.value) {
    errorMessage.value = 'Please select a file first.'
    return
  }

  busy.value = 'upload'
  try {
    media.value = await mediaApi.upload(selectedFile.value, {
      module: module.value.trim() || 'products',
      entityId: entityId.value.trim() || undefined,
      visibility: visibility.value,
    })
    metadataJson.value = JSON.stringify(media.value, null, 2)
    previewVersion.value += 1
    successMessage.value = 'File uploaded to media-api.'
  } catch (error) {
    fail(error, 'Upload failed.')
  } finally {
    busy.value = ''
  }
}

async function loadMetadata() {
  if (!media.value) return
  resetMessages()
  busy.value = 'metadata'
  try {
    media.value = await mediaApi.metadata(media.value.id)
    metadataJson.value = JSON.stringify(media.value, null, 2)
    successMessage.value = 'Metadata refreshed.'
  } catch (error) {
    fail(error, 'Metadata request failed.')
  } finally {
    busy.value = ''
  }
}

async function download() {
  if (!media.value) return
  resetMessages()
  busy.value = 'download'
  try {
    const blob = await mediaApi.downloadBlob(media.value.id)
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const baseName = media.value.original_filename.replace(/\.[^.]+$/, '') || media.value.id
    link.href = blobUrl
    link.download = `${baseName}.${media.value.format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(blobUrl)
    successMessage.value = 'File downloaded.'
  } catch (error) {
    fail(error, 'Download failed.')
  } finally {
    busy.value = ''
  }
}

async function remove() {
  if (!media.value) return
  resetMessages()
  busy.value = 'delete'
  try {
    await mediaApi.remove(media.value.id)
    successMessage.value = `Media ${media.value.id} deleted.`
    media.value = null
    metadataJson.value = ''
  } catch (error) {
    fail(error, 'Delete failed.')
  } finally {
    busy.value = ''
  }
}

function open(url: string | null | undefined) {
  if (url) window.open(url, '_blank', 'noopener')
}

onBeforeUnmount(() => {
  if (originalPreviewUrl.value) URL.revokeObjectURL(originalPreviewUrl.value)
})
</script>

<template>
  <main class="min-h-screen bg-slate-100 px-4 py-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-slate-900">LZHub Media API Test</h1>
        <p class="mt-1 text-sm text-slate-500">Media API: {{ MEDIA_API_BASE_URL || '(VITE_MEDIA_API_BASE_URL not set)' }}</p>
        <p class="text-sm text-slate-500">Client API: {{ CLIENT_API_BASE_URL || '(VITE_API_BASE_URL not set)' }}</p>
        <p class="text-sm text-slate-500">Client: {{ CLIENT_CODE }}</p>
      </header>

      <div v-if="errorMessage" class="rounded-xl bg-red-50 p-4 text-red-700">{{ errorMessage }}</div>
      <div v-if="successMessage" class="rounded-xl bg-emerald-50 p-4 text-emerald-700">{{ successMessage }}</div>

      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">1. Select file</h2>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
          class="mt-4 block w-full rounded-lg border border-slate-300 p-3"
          @change="handleFileSelect"
        >

        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <label class="text-sm">
            <span class="text-slate-500">Module</span>
            <input v-model="module" type="text" class="mt-1 block w-full rounded-lg border border-slate-300 p-2" placeholder="products">
          </label>
          <label class="text-sm">
            <span class="text-slate-500">Entity ID (optional)</span>
            <input v-model="entityId" type="text" class="mt-1 block w-full rounded-lg border border-slate-300 p-2" placeholder="PRD001">
          </label>
          <label class="text-sm">
            <span class="text-slate-500">Visibility</span>
            <select v-model="visibility" class="mt-1 block w-full rounded-lg border border-slate-300 p-2">
              <option value="public">public</option>
              <option value="private">private</option>
            </select>
          </label>
        </div>

        <div v-if="selectedFile" class="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <div class="text-slate-500">Original filename</div>
            <div class="break-all font-medium">{{ selectedFile.name }}</div>
          </div>
          <div>
            <div class="text-slate-500">Type</div>
            <div class="font-medium">{{ selectedFile.type || '-' }}</div>
          </div>
          <div>
            <div class="text-slate-500">Original size</div>
            <div class="font-medium">{{ originalSize }}</div>
          </div>
        </div>

        <div v-if="originalPreviewUrl" class="mt-6">
          <h3 class="mb-3 font-medium text-slate-700">Original image</h3>
          <div class="flex min-h-64 items-center justify-center rounded-xl border bg-slate-50 p-4">
            <img :src="originalPreviewUrl" alt="Original preview" class="max-h-96 max-w-full object-contain">
          </div>
        </div>

        <button
          type="button"
          :disabled="!selectedFile || busy !== ''"
          class="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          @click="upload"
        >
          {{ busy === 'upload' ? 'Uploading & optimizing...' : 'Upload' }}
        </button>
      </section>

      <section v-if="media" class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">2. Media API result</h2>

        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl bg-slate-50 p-4">
            <div class="text-xs uppercase text-slate-500">Original size</div>
            <div class="mt-1 text-lg font-semibold">{{ formatBytes(media.original_size_bytes) }}</div>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <div class="text-xs uppercase text-slate-500">Optimized size</div>
            <div class="mt-1 text-lg font-semibold">{{ optimizedSize }}</div>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <div class="text-xs uppercase text-slate-500">Saving</div>
            <div class="mt-1 text-lg font-semibold">{{ savingPercent === null ? '-' : `${savingPercent}%` }}</div>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <div class="text-xs uppercase text-slate-500">Stored format</div>
            <div class="mt-1 text-lg font-semibold uppercase">{{ media.format }}</div>
          </div>
        </div>

        <div v-if="media.type === 'image'" class="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <h3 class="mb-3 font-medium text-slate-700">Main image preview</h3>
            <div class="flex min-h-64 items-center justify-center rounded-xl border bg-slate-50 p-4">
              <img :src="previewUrl" alt="Optimized WebP preview" class="max-h-96 max-w-full object-contain">
            </div>
          </div>
          <div>
            <h3 class="mb-3 font-medium text-slate-700">Thumbnail preview</h3>
            <div class="flex min-h-64 items-center justify-center rounded-xl border bg-slate-50 p-4">
              <img v-if="thumbnailPreviewUrl" :src="thumbnailPreviewUrl" alt="Thumbnail preview" class="max-h-96 max-w-full object-contain">
            </div>
          </div>
        </div>
        <p v-else class="mt-6 text-sm text-slate-500">
          Document stored as <span class="font-medium">{{ media.mime_type }}</span>; use Open Image for inline preview (PDF) or Download.
        </p>

        <dl class="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <template v-for="[label, value] in details" :key="label">
            <div class="min-w-0">
              <dt class="text-slate-500">{{ label }}</dt>
              <dd class="break-all font-medium text-slate-900">{{ value }}</dd>
            </div>
          </template>
        </dl>

        <div class="mt-6 flex flex-wrap gap-3">
          <button type="button" class="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700" @click="open(media.view_url)">
            Open Image
          </button>
          <button
            type="button"
            :disabled="!media.thumbnail_url"
            class="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:opacity-50"
            @click="open(media.thumbnail_url)"
          >
            Open Thumbnail
          </button>
          <button
            type="button"
            :disabled="busy !== ''"
            class="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            @click="download"
          >
            {{ busy === 'download' ? 'Downloading...' : 'Download' }}
          </button>
          <button
            type="button"
            :disabled="busy !== ''"
            class="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:opacity-50"
            @click="loadMetadata"
          >
            {{ busy === 'metadata' ? 'Loading...' : 'Refresh Metadata' }}
          </button>
          <button
            type="button"
            :disabled="busy !== ''"
            class="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            @click="remove"
          >
            {{ busy === 'delete' ? 'Deleting...' : 'Delete' }}
          </button>
        </div>

        <div class="mt-6 rounded-xl bg-slate-950 p-4">
          <pre class="overflow-x-auto text-xs text-emerald-400">{{ metadataJson }}</pre>
        </div>
      </section>
    </div>
  </main>
</template>
