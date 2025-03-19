import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        'material-symbols-light': () => import('@iconify-json/material-symbols-light/icons.json').then(i => i.default),
        'mdi': () => import('@iconify-json/mdi/icons.json').then(i => i.default),
        'ph': () => import('@iconify-json/ph/icons.json').then(i => i.default),
      },
    }),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
    }),
  ],
  theme: {
    colors: {
      historymap: {
        100: '#ffe5e8',
        200: '#ffccd2',
        primary: '#FF7787',
        DEFAULT: '#FF7787',
      },
    },
  },
})
