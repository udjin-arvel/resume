<template>
  <span>
    <template
      v-for="(part, index) in parts"
      :key="index"
    >
      <NuxtLink
        v-if="part.kind === 'internal'"
        :to="part.href"
        :class="linkClass"
        class="inline-flex items-center gap-1"
      >
        {{ part.text }}
        <ArrowTopRightOnSquareIcon class="w-4 h-4 shrink-0" />
      </NuxtLink>
      <a
        v-else-if="part.kind === 'external'"
        :href="part.href"
        target="_blank"
        rel="noopener noreferrer"
        :class="linkClass"
      >
        {{ part.text }}
      </a>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/outline"

const props = defineProps<{
  text: string
  linkClass?: string
  allowInternal?: boolean
}>()

interface TextPart {
  text: string
  kind: "text" | "external" | "internal"
  href?: string
}

const markdownLink = "\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+|\\/[^\\s)]+)\\)"
const bareUrl = "https?:\\/\\/[^\\s]+"

const parts = computed<TextPart[]>(() => {
  if (!props.text) {
    return []
  }

  const source = props.allowInternal ? `${markdownLink}|${bareUrl}` : bareUrl
  const pattern = new RegExp(source, "g")

  const result: TextPart[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(props.text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: props.text.substring(lastIndex, match.index), kind: "text" })
    }

    if (match[0].startsWith("[")) {
      const label = match[1]
      const url = match[2]
      result.push({
        text: label,
        href: url,
        kind: url.startsWith("/") ? "internal" : "external",
      })
    }
    else {
      result.push({ text: match[0], href: match[0], kind: "external" })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < props.text.length) {
    result.push({ text: props.text.substring(lastIndex), kind: "text" })
  }

  return result.length > 0 ? result : [{ text: props.text, kind: "text" }]
})
</script>
