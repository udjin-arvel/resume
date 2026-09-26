export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxtjs/i18n",
    "@nuxtjs/tailwindcss",
    "nuxt-headlessui",
    "@pinia/nuxt",
    "nuxt-yandex-metrika",
    "@nuxtjs/sitemap",
  ],
  $development: {
    devtools: { enabled: false },
    runtimeConfig: {
      public: {
        directOssUpload: false,
      },
    },
  },
  $env: {
    cn: {
      devtools: { enabled: false },
      runtimeConfig: {
        public: {
          apiBase: "https://api.example.cn/",
          reverb: {
            key: "demo-reverb-key",
            host: "api.example.cn",
            port: 443,
            scheme: "https",
          },
          hcaptchaKey: "00000000-0000-0000-0000-000000000000",
          mainDomain: "https://example.cn",
          shareDomain: "https://share.example.cn",
          anonymousShareDomain: "https://anon.example.com",
          telegramBotName: "demo_bot",
          sentryEnv: "cn",
          sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || "",
        },
      },

    },
    staging: {
      devtools: { enabled: false },
      runtimeConfig: {
        public: {
          apiBase: "https://api.staging.example.com/",
          reverb: {
            key: "demo-reverb-key",
            host: "api.staging.example.com",
            port: 443,
            scheme: "https",
          },
          hcaptchaKey: "00000000-0000-0000-0000-000000000000",
          mainDomain: "https://staging.example.com",
          shareDomain: "https://share.example.com",
          anonymousShareDomain: "https://anon.example.com",
          telegramBotName: "demo_bot",
          sentryEnv: "staging",
          sentryDsn: "",
          directOssUpload: false,
        },
      },
    },
  },
  $production: {
    devtools: { enabled: false },
    runtimeConfig: {
      public: {
        apiBase: "https://api.example.com/",
        reverb: {
          key: "demo-reverb-key",
          host: "api.example.com",
          port: 443,
          scheme: "https",
        },
        hcaptchaKey: "00000000-0000-0000-0000-000000000000",
        mainDomain: "https://example.com",
        shareDomain: "https://share.example.com",
        anonymousShareDomain: "https://anon.example.com",
        telegramBotName: "demo_bot",
        sentryEnv: "production",
        sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || "",
      },
    },
  },
  imports: {
    dirs: [
      "composables/**",
    ],
  },
  site: {
    url: "https://example.com",
    name: "AutoShop",
  },
  runtimeConfig: {
    public: {
      apiBase: "http://localhost:8080/",
      directOssUpload: true,
      maxMultipartUploadBatchSizeBytes: 300 * 1024 * 1024, // 300 МБ
      auth: {
        jwt_ttl_second: 60 * 60 * 24,
        jwt_cookie_name: "token",
        jwt_refresh_second: 300,
        refresh_enabled: true,
      },
      reverb: {
        key: process.env.VITE_REVERB_APP_KEY || "demo-reverb-key",
        host: process.env.VITE_REVERB_HOST || "localhost",
        port: Number(process.env.VITE_REVERB_PORT) || 8081,
        scheme: process.env.VITE_REVERB_SCHEME || "http",
      },
      hcaptchaKey: process.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001",
      mainDomain: "http://localhost:3000",
      shareDomain: "http://share.localhost:3000",
      anonymousShareDomain: "http://anon.localhost:3000",
      telegramBotName: "demo_test_bot",
      sentryDsn: "",
      sentryEnv: "development",
    },
  },
  routeRules: {
    "/**": { ssr: true, cors: true },
    "/personal/**": { ssr: false, cors: true },
    "/tracking/**": { ssr: false, cors: true },
    "/admin/**": { ssr: false, cors: true },
    "/catalog": { ssr: true, cors: true, headers: { "X-Robots-Tag": "noindex, nofollow" } },
    "/catalog/**": { ssr: true, cors: true, headers: { "X-Robots-Tag": "noindex, nofollow" } },
  },
  // Скрытые client source maps остаются в сборке для поздней загрузки в GlitchTip.
  // В бандлы ссылка не попадает, браузер их не запрашивает.
  sourcemap: {
    client: "hidden",
  },
  // Современный сериализатор Nuxt умеет сериализовывать реактивные значения для SSR,
  // эта настройка не нужна, но пока что комментирую в случае непредвиденных багов.
  //
  // Включенная настройка вызывает warnings в консоли, на главной странице (/) и не только:
  //
  // browser.mjs?v=a68db326:48 ssr:warn Cannot stringify arbitrary non-POJOs RefImpl
  //   at log (node_modules/@nuxt/devalue/dist/devalue.mjs)
  //   at walk (node_modules/@nuxt/devalue/dist/devalue.mjs)
  //   at node_modules/@nuxt/devalue/dist/devalue.mjs
  //
  // Если side-эффектов не будет, то удалить комментарий через 2 месяца
  // experimental: {
  //  renderJsonPayloads: false,
  // },
  compatibilityDate: "2025-06-01",
  nitro: {
    output: {
      dir: "~/.output",
    },
    esbuild: {
      options: {
        target: "esnext",
      },
    },
    externals: {
      inline: ["vue-router", "@vue/devtools-api"],
    },
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls: false,
      },
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  postcss: {
    plugins: {
      "postcss-pxtorem": {
        rootValue: 16,
        propList: ["*", "!transform", "!transform-origin"],
        minPixelValue: 2,
      },
    },
  },
  headlessui: {
    prefix: "Headless",
  },
  i18n: {
    vueI18n: "~/lang/index.ts",
    strategy: "no_prefix",
    locales: [
      { code: "ru", name: "Russian" },
      { code: "zh", name: "Chinese" },
    ],
    defaultLocale: "ru",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "preferred_lang",
      redirectOn: "root",
      alwaysRedirect: false,
      fallbackLocale: "ru",
    },
  },
  sitemap: {
    exclude: [
      "/personal/**",
      "/admin/**",
      "/tracking/**",
      "/catalog",
      "/catalog/**",
      "/cars",
      "/diagnostic/**",
      "/compensation/**",
    ],
  },
  tailwindcss: {
    viewer: true,
    config: {},
    exposeConfig: true,
    editorSupport: true,
    cssPath: ["~/assets/css/tailwind.css", { injectPosition: "first" }],
    configPath: "~/tailwind.config.ts",
  },
  yandexMetrika: {
    id: "00000000",
    options: {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    },
  },
})
