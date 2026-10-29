<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

interface UploadResponse {
  success: boolean
  tenant: string
  filename: string
  path: string
  format: string
  size_bytes: number
  view_url: string
  download_url: string
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/v1'

const CLIENT_CODE =
  import.meta.env.VITE_CLIENT_CODE ||
  'lzhub'

const selectedFile = ref<File | null>(null)

const originalPreviewUrl = ref<string | null>(null)

const uploading = ref(false)
const downloading = ref(false)

const uploadResult = ref<UploadResponse | null>(null)

const errorMessage = ref('')
const successMessage = ref('')

const originalSize = computed(() => {
  if (!selectedFile.value) {
    return '-'
  }

  return formatBytes(selectedFile.value.size)
})

const compressedSize = computed(() => {
  if (!uploadResult.value) {
    return '-'
  }

  return formatBytes(uploadResult.value.size_bytes)
})

const savingPercent = computed(() => {
  if (
    !selectedFile.value ||
    !uploadResult.value ||
    selectedFile.value.size === 0
  ) {
    return null
  }

  const saved =
    1 -
    uploadResult.value.size_bytes /
      selectedFile.value.size

  return Math.max(
    0,
    Math.round(saved * 100)
  )
})

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`
}

function handleFileSelect(event: Event) {
  const input =
    event.target as HTMLInputElement

  resetMessages()
  uploadResult.value = null

  if (originalPreviewUrl.value) {
    URL.revokeObjectURL(
      originalPreviewUrl.value
    )
  }

  const file =
    input.files?.[0] ?? null

  selectedFile.value = file

  if (!file) {
    originalPreviewUrl.value = null
    return
  }

  originalPreviewUrl.value =
    URL.createObjectURL(file)
}

async function uploadImage() {
  resetMessages()

  if (!selectedFile.value) {
    errorMessage.value =
      'Please select an image first.'
    return
  }

  uploading.value = true

  try {
    const formData = new FormData()

    formData.append(
      'file',
      selectedFile.value
    )

    const response = await fetch(
      `${API_BASE_URL}/test/upload`,
      {
        method: 'POST',

        headers: {
          Accept: 'application/json',
          'X-Client-Code': CLIENT_CODE,
        },

        body: formData,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.message ||
        `Upload failed: HTTP ${response.status}`
      )
    }

    uploadResult.value =
      data as UploadResponse

    successMessage.value =
      'Image uploaded and converted successfully.'

  } catch (error) {
    console.error(error)

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Upload failed.'
  } finally {
    uploading.value = false
  }
}

async function downloadImage() {
  if (!uploadResult.value) {
    return
  }

  resetMessages()
  downloading.value = true

  try {
    const response = await fetch(
      uploadResult.value.download_url,
      {
        headers: {
          Accept: 'image/webp',
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Download failed: HTTP ${response.status}`
      )
    }

    const blob = await response.blob()
    const blobUrl =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

    link.href = blobUrl
    link.download =
      uploadResult.value.filename

    document.body.appendChild(link)

    link.click()
    link.remove()

    URL.revokeObjectURL(blobUrl)

    successMessage.value =
      'Image downloaded successfully.'

  } catch (error) {
    console.error(error)

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Download failed.'
  } finally {
    downloading.value = false
  }
}

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

onBeforeUnmount(() => {
  if (originalPreviewUrl.value) {
    URL.revokeObjectURL(
      originalPreviewUrl.value
    )
  }
})
</script>

<template>
  <main
    class="min-h-screen bg-slate-100 px-4 py-8"
  >
    <div
      class="mx-auto max-w-5xl space-y-6"
    >
      <header>
        <h1
          class="text-2xl font-bold text-slate-900"
        >
          LZHub Upload API Test
        </h1>

        <p
          class="mt-1 text-sm text-slate-500"
        >
          {{ API_BASE_URL }}
        </p>

        <p
          class="text-sm text-slate-500"
        >
          Client: {{ CLIENT_CODE }}
        </p>
      </header>

      <div
        v-if="errorMessage"
        class="rounded-xl bg-red-50 p-4 text-red-700"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="successMessage"
        class="rounded-xl bg-emerald-50 p-4 text-emerald-700"
      >
        {{ successMessage }}
      </div>

      <section
        class="rounded-2xl bg-white p-6 shadow-sm"
      >
        <h2
          class="text-lg font-semibold text-slate-900"
        >
          1. Select image
        </h2>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="mt-4 block w-full rounded-lg border border-slate-300 p-3"
          @change="handleFileSelect"
        >

        <div
          v-if="selectedFile"
          class="mt-5 grid gap-3 text-sm sm:grid-cols-3"
        >
          <div>
            <div class="text-slate-500">
              Filename
            </div>

            <div
              class="break-all font-medium"
            >
              {{ selectedFile.name }}
            </div>
          </div>

          <div>
            <div class="text-slate-500">
              Type
            </div>

            <div class="font-medium">
              {{ selectedFile.type }}
            </div>
          </div>

          <div>
            <div class="text-slate-500">
              Original size
            </div>

            <div class="font-medium">
              {{ originalSize }}
            </div>
          </div>
        </div>

        <div
          v-if="originalPreviewUrl"
          class="mt-6"
        >
          <h3
            class="mb-3 font-medium text-slate-700"
          >
            Original image
          </h3>

          <div
            class="flex min-h-64 items-center justify-center rounded-xl border bg-slate-50 p-4"
          >
            <img
              :src="originalPreviewUrl"
              alt="Original preview"
              class="max-h-96 max-w-full object-contain"
            >
          </div>
        </div>

        <button
          type="button"
          :disabled="
            !selectedFile ||
            uploading
          "
          class="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          @click="uploadImage"
        >
          {{
            uploading
              ? 'Uploading & Compressing...'
              : 'Upload Image'
          }}
        </button>
      </section>

      <section
        v-if="uploadResult"
        class="rounded-2xl bg-white p-6 shadow-sm"
      >
        <h2
          class="text-lg font-semibold text-slate-900"
        >
          2. API result
        </h2>

        <div
          class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div
            class="rounded-xl bg-slate-50 p-4"
          >
            <div
              class="text-xs uppercase text-slate-500"
            >
              Original
            </div>

            <div
              class="mt-1 text-lg font-semibold"
            >
              {{ originalSize }}
            </div>
          </div>

          <div
            class="rounded-xl bg-slate-50 p-4"
          >
            <div
              class="text-xs uppercase text-slate-500"
            >
              WebP
            </div>

            <div
              class="mt-1 text-lg font-semibold"
            >
              {{ compressedSize }}
            </div>
          </div>

          <div
            class="rounded-xl bg-slate-50 p-4"
          >
            <div
              class="text-xs uppercase text-slate-500"
            >
              Saving
            </div>

            <div
              class="mt-1 text-lg font-semibold"
            >
              {{ savingPercent }}%
            </div>
          </div>

          <div
            class="rounded-xl bg-slate-50 p-4"
          >
            <div
              class="text-xs uppercase text-slate-500"
            >
              Format
            </div>

            <div
              class="mt-1 text-lg font-semibold uppercase"
            >
              {{ uploadResult.format }}
            </div>
          </div>
        </div>

        <div class="mt-6">
          <h3
            class="mb-3 font-medium text-slate-700"
          >
            Stored image preview
          </h3>

          <div
            class="flex min-h-64 items-center justify-center rounded-xl border bg-slate-50 p-4"
          >
            <img
              :src="uploadResult.view_url"
              alt="Uploaded WebP preview"
              class="max-h-96 max-w-full object-contain"
            >
          </div>
        </div>

        <div
          class="mt-6 flex flex-wrap gap-3"
        >
          <a
            :href="uploadResult.view_url"
            target="_blank"
            rel="noopener"
            class="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700"
          >
            Open Image
          </a>

          <button
            type="button"
            :disabled="downloading"
            class="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            @click="downloadImage"
          >
            {{
              downloading
                ? 'Downloading...'
                : 'Download WebP'
            }}
          </button>
        </div>

        <div
          class="mt-6 rounded-xl bg-slate-950 p-4"
        >
          <pre
            class="overflow-x-auto text-xs text-emerald-400"
          >{{ JSON.stringify(uploadResult, null, 2) }}</pre>
        </div>
      </section>
    </div>
  </main>
</template>
