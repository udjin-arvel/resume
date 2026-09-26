<template>
  <div :class="$style.wrapper">
    <div :class="$style.container">
      <h1 :class="$style.h1__title">
        Контакты
      </h1>

      <MainConsult />

      <div :class="$style.team">
        <h2 :class="$style.team__title">
          Наша команда
        </h2>

        <div :class="$style.team_grid">
          <div
            v-for="(person, index) in team"
            :key="index"
            :class="$style.card"
          >
            <div :class="$style.photo_wrapper">
              <img
                :src="person.image"
                :alt="person.name"
                :class="$style.photo"
              >
            </div>

            <div :class="$style.info">
              <div :class="$style.name">
                {{ person.name }}
              </div>
              <div :class="$style.role">
                {{ person.role }}
              </div>
            </div>

            <div
              v-if="person.socials"
              :class="$style.socials"
            >
              <template
                v-for="(social, sIndex) in person.socials"
                :key="sIndex"
              >
                <NuxtLink
                  v-if="social.type !== 'wechat'"
                  :to="social.link"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  :class="$style.social_link"
                >
                  <img
                    :src="social.icon"
                    :alt="social.type"
                    :class="$style.social_icon"
                  >
                </NuxtLink>

                <WechatModal
                  v-else
                  :class="$style.social_link"
                >
                  <img
                    :src="social.icon"
                    :alt="social.type"
                    :class="$style.social_icon"
                  >
                </WechatModal>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WechatModal from "@/components/common/WechatModal.vue"

usePageSeoMeta({
  title: "Контакты AutoShop | Доставка автомобилей из Китая",
  ogTitle: "Контакты AutoShop | Доставка автомобилей из Китая",
  description: "Свяжитесь с нами: телефоны, WhatsApp, Telegram, WeChat. Офисы в России и Китае. Работаем с юридическими лицами.",
  ogDescription: "Свяжитесь с нами: телефоны, WhatsApp, Telegram, WeChat. Офисы в России и Китае. Работаем с юридическими лицами.",
})

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/team-1.jpg",
          "name": "Алексей Иванов — Руководитель отдела продаж",
        },
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/team-2.jpg",
          "name": "Дмитрий Петров — Старший менеджер отдела по работе с клиентами",
        },
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/team-3.jpg",
          "name": "Артём Сидоров — Менеджер отдела по работе с клиентами",
        },
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/team-4.jpg",
          "name": "Владимир Орлов — Менеджер отдела по работе с клиентами",
        },
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/team-5.jpg",
          "name": "Кирилл Волков — Менеджер отдела по работе с клиентами",
        },
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/team-6.jpg",
          "name": "Глеб Новиков — Менеджер отдела по работе с клиентами",
        },
      ]),
    },
  ],
})

const team = [
  {
    name: "Алексей Иванов",
    role: "Руководитель отдела продаж",
    image: "/team-1.jpg",
  },
  {
    name: "Дмитрий Петров",
    role: "Старший менеджер отдела по работе с клиентами",
    image: "/team-2.jpg",
    socials: [
      { type: "whatsapp", link: "https://wa.me/79000000000", icon: "/wa-ico.svg" },
      { type: "telegram", link: "https://t.me/demo_manager", icon: "/tg-ico.svg" },
      { type: "max", link: "https://example.com/messenger", icon: "/max-ico.svg" },
      { type: "wechat", link: "#", icon: "/we-ico.svg" },
    ],
  },
  {
    name: "Артём Сидоров",
    role: "Менеджер отдела по работе с клиентами",
    image: "/team-3.jpg",
  },
  {
    name: "Владимир Орлов",
    role: "Менеджер отдела по работе с клиентами",
    image: "/team-4.jpg",
  },
  {
    name: "Кирилл Волков",
    role: "Менеджер отдела по работе с клиентами",
    image: "/team-5.jpg",
  },
  {
    name: "Глеб Новиков",
    role: "Менеджер отдела по работе с клиентами",
    image: "/team-6.jpg",
  },
]
</script>

<style module>
.wrapper {
  @apply py-[2.5rem] mb-[5rem];
}

.container {
  @apply mx-auto px-[0.625rem] max-w-[88.75rem];
}

.h1__title {
  @apply font-bold text-black leading-none text-[3rem] mb-[3rem] text-center;
}

.team {
  @apply mt-[5rem];
}

.team__title {
  @apply text-[2.5rem] font-bold text-center mb-[3.125rem];
}

.team_grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2rem];
}

.card {
  @apply h-full flex flex-col items-center justify-between bg-white rounded-[1.25rem] p-[2rem] shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.06)] border border-gray-100 hover:-translate-y-1 hover:shadow-[0_1rem_2rem_rgba(0,0,0,0.1)] transition-all duration-300;
}

.photo_wrapper {
  @apply w-[13.75rem] h-[13.75rem] rounded-full overflow-hidden mb-[1.5rem] border-4 border-gray-50 flex-shrink-0;
}

.photo {
  @apply w-full h-full object-cover;
}

.info {
  @apply flex flex-col items-center flex-grow mb-[1rem];
}

.name {
  @apply text-[1.5rem] font-bold text-black mb-[0.5rem] text-center;
}

.role {
  @apply text-[1.125rem] text-gray-500 text-center leading-[1.4];
}

.socials {
  @apply flex justify-center items-center gap-[0.75rem] mt-auto w-full pt-[1rem] border-t border-gray-100;
}

.social_link {
  @apply inline-flex items-center justify-center w-[2.25rem] h-[2.25rem] rounded-full transition-transform duration-300 hover:scale-110;
}

.social_icon {
  @apply w-[1.75rem] h-[1.75rem] object-contain;
}

@media (max-width: 640px) {
  .h1__title {
    @apply text-[2rem] mb-[2rem];
  }
  .wrapper {
    @apply py-[1.5rem] mb-[3rem];
  }
  .team {
    @apply mt-[3rem];
  }
  .team__title {
    @apply text-[2rem] mb-[2rem];
  }
  .card {
    @apply p-[1.5rem];
  }
  .photo_wrapper {
    @apply w-[11rem] h-[11rem];
  }
  .name {
    @apply text-[1.25rem];
  }
  .role {
    @apply text-[1rem];
  }
  .socials {
    @apply pt-[0.75rem];
  }
}
</style>
