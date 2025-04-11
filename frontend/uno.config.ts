import { defineConfig, presetUno, presetWind, presetIcons, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(), // Temel preset (isteğe bağlı)
    presetWind(), // Tailwind CSS uyumluluğu için
    presetIcons()
  ],
  transformers: [
    transformerVariantGroup()
  ],
  // Kendi özel kurallarınızı veya tema ayarlarınızı buraya ekleyebilirsiniz
  // theme: {
  //   colors: {
  //     primary: '#yourColor',
  //   }
  // },
  theme: {
    animation: {
      keyframes: {
        'bounce-up-and-fade': '{0% {opacity: 0; transform: translateY(10px)} 25% {opacity: 1; transform: translateY(-5px)} 75% {opacity: 1; transform: translateY(-20px)} 100% {opacity: 0; transform: translateY(-30px)}}'
      },
      durations: {
        'bounce-up-and-fade': '2s'
      }
    }
  }
}) 