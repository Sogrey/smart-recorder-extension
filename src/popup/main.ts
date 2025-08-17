import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PopupApp from './PopupApp.vue'
import './style.css'

const app = createApp(PopupApp)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
