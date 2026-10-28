import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useClientStore } from './stores/client'
import { useCatalogueStore } from './stores/catalogue'
import './assets/css/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Theme + config first so the shell renders with the right brand, then catalogue in parallel.
const client = useClientStore(pinia)
client.applyTheme()
void client.init()
void useCatalogueStore(pinia).load()

app.mount('#app')
