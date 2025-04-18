import { defineConfig, presetUno, presetWind, presetIcons, transformerVariantGroup } from 'unocss'
import { colors } from './src/theme'

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
    colors: {
      // theme.ts'den renkleri alıyoruz
      background: colors.background, // Koyu arka plan
      surface: colors.surface, // Kartlar için biraz daha açık yüzey
      primary: colors.primary, // Ana vurgu rengi (mor)
      secondary: colors.secondary, // İkincil vurgu rengi (mavi)
      text: colors.text, // Ana metin rengi (açık gri)
      'text-secondary': colors.textSecondary, // İkincil metin rengi (gri)
      'xp-bar': colors.xpBar, // XP barı rengi
      success: colors.success, // Başarı rengi
      error: colors.error, // Hata rengi
    },
    animation: {
      keyframes: {
        'bounce-up-and-fade': '{0% {opacity: 0; transform: translateY(10px)} 25% {opacity: 1; transform: translateY(-5px)} 75% {opacity: 1; transform: translateY(-20px)} 100% {opacity: 0; transform: translateY(-30px)}}',
        'confetti': '{0% {transform: translateY(0) rotateZ(0); opacity: 1;} 100% {transform: translateY(500px) rotateZ(360deg); opacity: 0;}}'
      },
      durations: {
        'bounce-up-and-fade': '2s',
        'confetti': '3s'
      }
    }
  }
}) 