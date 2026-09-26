<template>
  <v-card max-width="960" class="mx-auto">
    <v-card-title>Импорт истории из DOCX</v-card-title>
    <v-card-text>
      <v-stepper v-model="step" alt-labels>
        <v-stepper-header>
          <v-stepper-item :complete="step > 1" :value="1" title="Файл" />
          <v-divider />
          <v-stepper-item :complete="step > 2" :value="2" title="Предпросмотр" />
          <v-divider />
          <v-stepper-item :complete="step > 3" :value="3" title="Метаданные" />
          <v-divider />
          <v-stepper-item :value="4" title="Создание" />
        </v-stepper-header>

        <v-stepper-window>
          <!-- Step 1: Upload -->
          <v-stepper-window-item :value="1">
            <v-file-input
              v-model="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              label="Выберите DOCX файл"
              prepend-icon="mdi-file-word"
              show-size
            />
            <v-btn
              color="primary"
              class="mt-4"
              :disabled="!file"
              :loading="parsing"
              @click="parseFile"
            >
              Разобрать файл
            </v-btn>
          </v-stepper-window-item>

          <!-- Step 2: Preview -->
          <v-stepper-window-item :value="2">
            <v-alert type="info" variant="tonal" class="mb-4">
              {{ preview?.fragmentCount }} фрагментов, {{ preview?.totalChars }} символов
            </v-alert>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Длина</th>
                  <th>Начало текста</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="frag in preview?.fragments" :key="frag.order">
                  <td>{{ frag.order }}</td>
                  <td>{{ frag.charCount }}</td>
                  <td class="text-truncate" style="max-width: 480px">{{ frag.text.slice(0, 120) }}...</td>
                </tr>
              </tbody>
            </v-table>
            <div class="d-flex ga-2 mt-4">
              <v-btn variant="text" @click="step = 1">Назад</v-btn>
              <v-btn color="primary" @click="step = 3">Далее</v-btn>
            </div>
          </v-stepper-window-item>

          <!-- Step 3: Metadata -->
          <v-stepper-window-item :value="3">
            <v-text-field v-model="meta.title" label="Название" />
            <v-select v-model="meta.type" :items="storyTypes" label="Тип" />
            <v-autocomplete
              v-model="meta.userId"
              :items="users"
              item-title="login"
              item-value="id"
              label="Автор"
            />
            <v-autocomplete
              v-model="meta.compositionId"
              :items="compositions"
              item-title="title"
              item-value="id"
              label="Композиция"
              clearable
            />
            <v-text-field v-model.number="meta.accessLevel" label="Уровень доступа" type="number" />
            <v-text-field v-model.number="meta.chapter" label="Глава" type="number" />
            <v-switch v-model="meta.isPublic" label="Публичная" color="primary" />
            <div class="d-flex ga-2 mt-4">
              <v-btn variant="text" @click="step = 2">Назад</v-btn>
              <v-btn color="primary" @click="step = 4">Далее</v-btn>
            </div>
          </v-stepper-window-item>

          <!-- Step 4: Confirm -->
          <v-stepper-window-item :value="4">
            <v-list density="compact">
              <v-list-item title="Название" :subtitle="meta.title" />
              <v-list-item title="Тип" :subtitle="meta.type" />
              <v-list-item title="Фрагментов" :subtitle="String(preview?.fragmentCount)" />
              <v-list-item title="Автор" :subtitle="users.find(u => u.id === meta.userId)?.login || '—'" />
            </v-list>
            <div class="d-flex ga-2 mt-4">
              <v-btn variant="text" @click="step = 3">Назад</v-btn>
              <v-btn color="primary" :loading="creating" @click="createStory">Создать историю</v-btn>
            </div>
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] });

const { adminApi, adminFormData } = useAdminApi();
const authStore = useAuthStore();
const snackbar = inject<(t: string, c?: string) => void>('adminSnackbar');
const router = useRouter();

const step = ref(1);
const file = ref<File[]>([]);
const parsing = ref(false);
const creating = ref(false);
const preview = ref<any>(null);
const users = ref<any[]>([]);
const compositions = ref<any[]>([]);

const storyTypes = [
  { title: 'История', value: 'STORY' },
  { title: 'Анонс', value: 'ANNOUNCEMENT' },
];

const meta = reactive({
  title: '',
  type: 'STORY',
  userId: authStore.user?.id,
  compositionId: null as number | null,
  accessLevel: 1,
  chapter: null as number | null,
  isPublic: true,
});

onMounted(async () => {
  const [usersRes, compRes] = await Promise.all([
    adminApi<any>('/users/options'),
    adminApi<any>('/compositions', { query: { limit: 100 } }),
  ]);
  users.value = usersRes.data;
  compositions.value = compRes.data.compositions;
  if (!meta.userId && authStore.user) meta.userId = authStore.user.id;
});

async function parseFile() {
  const f = Array.isArray(file.value) ? file.value[0] : file.value;
  if (!f) return;

  parsing.value = true;
  try {
    const fd = new FormData();
    fd.append('file', f);
    const res = await adminFormData<any>('/stories/import-docx/preview', fd);
    preview.value = res.data;
    meta.title = res.data.title;
    step.value = 2;
  } catch (e: any) {
    snackbar?.(e.data?.error || 'Ошибка парсинга', 'error');
  } finally {
    parsing.value = false;
  }
}

async function createStory() {
  creating.value = true;
  try {
    const res = await adminApi<any>('/stories/import-docx', {
      method: 'POST',
      body: {
        ...meta,
        fragments: preview.value.fragments,
      },
    });
    snackbar?.('История создана');
    router.push(`/admin/stories/${res.data.id}`);
  } catch (e: any) {
    snackbar?.(e.data?.error || 'Ошибка создания', 'error');
  } finally {
    creating.value = false;
  }
}
</script>
