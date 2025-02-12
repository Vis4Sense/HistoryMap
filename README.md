# HistoryMap

Initialised with the [vitesse-webext](https://github.com/antfu-collective/vitesse-webext) template.

## Usage

Ensure you have [pnpm](https://pnpm.js.org/) installed.

1. clone to local
2. Install dependencies: `pnpm i`
3. Run: `pnpm build` or `pnpm dev` (if you are developing)

When you use it for the first time, you need to load the extension (the `extension` folder) to your browser.

## Contribute

To contribute to this project, it is necessary to know how a [Chrome extension (Manifest V3)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3) is structured, e.g., the role of content script, background script, etc. Also, you need to be familiar with [TypeScript](https://www.typescriptlang.org/) and [Vue 3](https://vuejs.org/), specifically the vue composition API and [`<script setup>` syntax](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md). If you are new to these, you may start with reading through the beginner's guide and learn more about them as you work on the project.

### Folders

- `src` - main source.
  - `contentScript` - scripts and components to be injected as `content_script`
  - `background` - scripts for background.
  - `components` - auto-imported Vue components that are shared in popup and options page.
  - `styles` - styles shared in popup and options page
  - `assets` - assets used in Vue components
  - `manifest.ts` - manifest for the extension.
- `extension` - extension package root.
  - `assets` - static assets (mainly for `manifest.json`).
  - `dist` - built files, also serve stub entry for Vite on development.
- `scripts` - development and bundling helper scripts.

### Useful libraries and documents

- [Chrome extension APIs](https://developer.chrome.com/docs/extensions/reference/api)
- [UnoCSS](https://github.com/unocss/unocss) - instant on-demand Atomic CSS engine.
- [`webext-bridge`](https://github.com/antfu/webext-bridge) - a library that makes messaging easy.
- [`unplugin-icons`](https://github.com/antfu/unplugin-icons) - icons as components
  - [Iconify](https://iconify.design) - use icons from any icon sets [🔍Icônes](https://icones.netlify.app/)
- [VueUse](https://github.com/antfu/vueuse) - collection of useful composition APIs
