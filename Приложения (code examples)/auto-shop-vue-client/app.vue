<template>
  <Head>
    <template v-if="!isAnonymousDomain">
      <Link
        rel="icon"
        type="image/png"
        href="/favicon-96x96.png"
        sizes="96x96"
      />
      <Link
        rel="icon"
        type="image/svg+xml"
        href="/favicon.svg"
      />
      <Link
        rel="shortcut icon"
        href="/favicon.ico"
      />
      <Link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <Meta
        name="apple-mobile-web-app-title"
        :content="t('about.name')"
      />
      <Link
        rel="manifest"
        href="/site.webmanifest"
      />
    </template>
    <template v-else>
      <Link
        rel="icon"
        href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII="
      />
    </template>
  </Head>
  <ClientOnly>
    <NuxtLoadingIndicator color="#DB0020" />
  </ClientOnly>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <FormMediaUploadProgress />
  </ClientOnly>
  <NoticeNotifications />
</template>

<script setup lang="ts">
const { t, te } = useI18n()
const route = useRoute()
const config = useRuntimeConfig()
const { isAnonymousDomain } = useShareDomain()

const brandUrl = (path: string) =>
  ((isAnonymousDomain.value ? config.public.anonymousShareDomain : config.public.mainDomain) as string)
    .replace(/\/$/, "") + path

provideHeadlessUseId(() => useId())
useLocale()

useHead({
  bodyAttrs: { class: "h-full" },
  htmlAttrs: { class: "h-full", lang: "ru" },
  title: () => {
    const navigationKey = `navigation.${String(route.name)}`
    const routeTitle = te(navigationKey) ? t(navigationKey) : ""

    if (isAnonymousDomain.value) {
      return routeTitle
    }
    return routeTitle ? `${routeTitle} - ${t("about.name")}` : t("about.name")
  },
  meta: [
    {
      name: "google-site-verification",
      content: "demo-verification-token",
    },
  ],
  link: [
    { rel: "canonical", href: () => brandUrl(route.path) },
  ],
  script: isAnonymousDomain.value
    ? []
    : [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "AutoShop",
            "url": "https://example.com",
            "telephone": "+79000000000",
            "email": "hello@example.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://example.com/logo.png",
              "width": 4000,
              "height": 1638,
            },
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "ул. Примерная, 1",
              "addressLocality": "г. Примерск",
              "addressRegion": "Примерская область",
              "addressCountry": "RU",
            },
          }),
        },
      ],
})

usePageSeoMeta({
  ogSiteName: isAnonymousDomain.value ? undefined : "AutoShop",
  ogType: "website",
  ogLocale: "ru_RU",
  ogImage: isAnonymousDomain.value ? undefined : "https://example.com/og-image.png",
  ogImageWidth: isAnonymousDomain.value ? undefined : 1200,
  ogImageHeight: isAnonymousDomain.value ? undefined : 630,
  ogImageType: isAnonymousDomain.value ? undefined : "image/png",
  ogImageAlt: isAnonymousDomain.value ? undefined : "AutoShop — экспорт автомобилей из Китая",
  twitterCard: "summary_large_image",
  ogUrl: () => brandUrl(route.path),
})
</script>
