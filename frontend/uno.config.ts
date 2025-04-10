import { defineConfig, presetUno, presetWind } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(), // Temel preset (isteğe bağlı)
    presetWind(), // Tailwind CSS uyumluluğu için
  ],
  // Kendi özel kurallarınızı veya tema ayarlarınızı buraya ekleyebilirsiniz
  // theme: {
  //   colors: {
  //     primary: '#yourColor',
  //   }
  // },
}) 