import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Boykot Hakkı',
    description: 'Aktif ettiğiniz boykot listelerindeki websitelere girdiğinizde uyarı gösteren bir eklentidir. Siteleri kullanmanızı engellemez.',
    version: '0.1.0',
    permissions: ['tabs', 'storage', 'alarms'],
    host_permissions: ['https://raw.githubusercontent.com/*'],
    browser_specific_settings: {
      gecko: {
        id: 'addon@example.com', // Replace with your email address or use a UUID
      },
    },
  },
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
});