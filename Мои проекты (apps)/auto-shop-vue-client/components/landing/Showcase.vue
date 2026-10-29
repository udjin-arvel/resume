<template>
  <section
    :id="id"
    :class="['ld-stripe', alt && 'ld-stripe--alt']"
  >
    <div class="ld-wrap">
      <div :class="['ld-show-row', reverse && 'ld-show-row--rev', alignStart && 'ld-show-row--start']">
        <div class="ld-show-copy ld-reveal">
          <span class="ld-eyebrow">{{ eyebrow }}</span>
          <h2 class="ld-h2">
            {{ title }}
          </h2>
          <p class="ld-lead">
            {{ lead }}
          </p>
          <ul class="ld-feat-list">
            <li
              v-for="feature in features"
              :key="feature"
            >
              <LandingCheckIcon />{{ feature }}
            </li>
          </ul>
          <slot name="action" />
          <p
            v-if="hint"
            class="ld-hint"
          >
            {{ hint }}
          </p>
        </div>
        <div :class="['ld-demo', 'ld-reveal', demoClass]">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  id?: string
  eyebrow: string
  title: string
  lead: string
  features: string[]
  hint?: string
  reverse?: boolean
  alt?: boolean
  alignStart?: boolean
  demoClass?: string
}>(), {
  id: undefined,
  hint: "",
  reverse: false,
  alt: false,
  alignStart: false,
  demoClass: "",
})
</script>
