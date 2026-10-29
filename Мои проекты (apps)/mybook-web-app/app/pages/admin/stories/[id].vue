<template>
  <div>
    <v-card v-if="story" :loading="loading">
      <v-card-title>{{ story.title }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.title" label="Название" />
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="form.type" :items="['STORY', 'ANNOUNCEMENT']" label="Тип" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model.number="form.chapter" label="Глава" type="number" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model.number="form.accessLevel" label="Уровень доступа" type="number" />
          </v-col>
          <v-col cols="12" md="3">
            <v-switch v-model="form.isPublic" label="Публичная" color="primary" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.epigraph" label="Эпиграф" />
          </v-col>
        </v-row>

        <div class="text-subtitle-1 mb-2">Фрагменты ({{ form.fragments.length }})</div>
        <v-expansion-panels>
          <v-expansion-panel v-for="(frag, i) in form.fragments" :key="i">
            <v-expansion-panel-title>
              #{{ i + 1 }} — {{ frag.text.length }} симв.
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-textarea v-model="frag.text" rows="6" auto-grow />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" to="/admin/stories">Назад</v-btn>
        <v-spacer />
        <v-btn color="primary" :loading="saving" @click="save">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] });

const route = useRoute();
const { adminApi } = useAdminApi();
const snackbar = inject<(t: string, c?: string) => void>('adminSnackbar');

const story = ref<any>(null);
const loading = ref(true);
const saving = ref(false);
const form = reactive<any>({ fragments: [] });

onMounted(async () => {
  try {
    const res = await adminApi<any>(`/stories/${route.params.id}`);
    story.value = res.data;
    Object.assign(form, {
      title: res.data.title,
      type: res.data.type,
      chapter: res.data.chapter,
      accessLevel: res.data.accessLevel,
      isPublic: res.data.isPublic,
      epigraph: res.data.epigraph || '',
      compositionId: res.data.compositionId,
      fragments: res.data.fragments.map((f: any, i: number) => ({
        order: i + 1,
        text: f.text,
      })),
    });
  } finally {
    loading.value = false;
  }
});

async function save() {
  saving.value = true;
  try {
    await adminApi(`/stories/${route.params.id}`, {
      method: 'PUT',
      body: {
        ...form,
        fragments: form.fragments.map((f: any, i: number) => ({ order: i + 1, text: f.text })),
      },
    });
    snackbar?.('Сохранено');
  } catch {
    snackbar?.('Ошибка сохранения', 'error');
  } finally {
    saving.value = false;
  }
}
</script>
