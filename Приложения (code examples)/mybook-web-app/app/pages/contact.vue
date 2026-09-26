<template>
  <div class="contact-page">
    <h1 class="text-3xl font-bold text-gold mb-6">Контакты</h1>

    <div class="surface-card overflow-hidden">
      <a
        href="mailto:contact@thebook.com"
        class="md-list-item rounded-none hover:rounded-none"
      >
        <div class="md-list-item-icon">
          <Icon name="fa6-solid:envelope" class="md-list-item-icon-svg" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-white font-medium">Email</div>
          <div class="text-on-surface-muted text-sm truncate">contact@thebook.com</div>
        </div>
        <Icon name="fa6-solid:chevron-right" class="w-4 h-4 text-on-surface-muted flex-shrink-0" />
      </a>

      <div class="border-t border-white/5" />

      <a
        href="https://t.me/thebook"
        target="_blank"
        rel="noopener noreferrer"
        class="md-list-item rounded-none hover:rounded-none"
      >
        <div class="md-list-item-icon !bg-[#2AABEE]/15">
          <Icon name="fa6-brands:telegram" class="w-3.5 h-3.5 text-[#2AABEE]" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-white font-medium">Telegram</div>
          <div class="text-on-surface-muted text-sm truncate">@thebook</div>
        </div>
        <Icon name="fa6-solid:arrow-up-right-from-square" class="w-4 h-4 text-on-surface-muted flex-shrink-0" />
      </a>

      <div class="border-t border-white/5" />

      <a
        href="tel:+79000000000"
        class="md-list-item rounded-none hover:rounded-none"
      >
        <div class="md-list-item-icon">
          <Icon name="fa6-solid:phone" class="md-list-item-icon-svg" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-white font-medium">Телефон</div>
          <div class="text-on-surface-muted text-sm truncate">+7 900 000-00-00</div>
        </div>
        <Icon name="fa6-solid:chevron-right" class="w-4 h-4 text-on-surface-muted flex-shrink-0" />
      </a>
    </div>

    <div class="mt-6 surface-card-soft p-4 flex items-start gap-3">
      <Icon name="fa6-solid:circle-info" class="w-5 h-5 text-beige flex-shrink-0 mt-0.5" />
      <div>
        <p class="text-gray-300 text-sm leading-relaxed">
          Свяжитесь со мной любым удобным способом для получения поддержки,
          предложений или просто для общения о проекте.
        </p>
        <p class="text-beige text-sm mt-2">
          Время ответа: в течение 24 часов
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// SEO
useHead({
  title: 'Контакты - TheBook',
  meta: [
    { name: 'description', content: 'Свяжитесь с командой TheBook для поддержки и предложений' }
  ]
});
</script>
