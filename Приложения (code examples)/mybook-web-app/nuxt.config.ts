// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SPA mode: content is client-fetched; SEO not a priority yet.
  // To re-enable: ssr: true + useAsyncData on public read pages + dynamic useHead/OG.
  ssr: false,
  typescript: {
    tsConfig: {
      compilerOptions: {
        noImplicitAny: false
      }
    }
  },
  devServer: {
    port: 3000,
    host: 'localhost'
  },
  devtools: {
    enabled: process.env.NUXT_DEVTOOLS !== 'false',
  },
  vite: {
    css: {
      preprocessorMaxWorkers: true,
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          quietDeps: true,
        },
      },
    },
  },
  css: [
    '~/assets/scss/main.scss',
    '~/assets/scss/vue-client-recaptcha.css',
  ],
  postcss: {
    plugins: {
      autoprefixer: {},
    },
  },
  modules: [
    '@nuxtjs/tailwindcss', 
    '@pinia/nuxt',
    '@nuxt/icon',
    '@nuxt/eslint',
    'vuetify-nuxt-module',
  ],
  vuetify: {
    moduleOptions: {
      styles: { configFile: 'assets/scss/vuetify-settings.scss' },
      importComposables: false,
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'thebook',
        themes: {
          thebook: {
            dark: true,
            colors: {
              background: '#212121',
              surface: '#1a1a1a',
              'surface-bright': '#242424',
              'surface-light': '#2c2c2c',
              'surface-variant': '#2c2c2c',
              'on-surface-variant': '#a8a8a8',
              primary: '#ddb089',
              secondary: '#e78c3d',
              accent: '#e78c3d',
              error: '#ff4b44',
              info: '#ddb089',
              success: '#22c55e',
              warning: '#e78c3d',
              'on-background': '#ffffff',
              'on-surface': '#ffffff',
              'on-primary': '#121212',
              'on-secondary': '#121212',
            },
          },
        },
      },
    },
  },
  compatibilityDate: '2025-08-31',
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001',
      isDev: process.env.NODE_ENV === 'development'
    }
  },
  icon: {
    size: '24px',
    class: 'icon',
    serverBundle: 'local',
    clientBundle: {
      scan: true,
    },
  },
  nitro: {
    routeRules: {
      '/api/_nuxt_icon/**': {},
      '/api/**': {
        proxy: 'http://localhost:3001/api/**'
      },
      '/uploads/**': {
        proxy: 'http://localhost:3001/uploads/**'
      }
    }
  },
  experimental: {
    payloadExtraction: false
  }
});
