export function useAdminCrud(config: {
  endpoint: string;
  itemsKey: string;
}) {
  const { adminApi } = useAdminApi();
  const snackbar = inject<(t: string, c?: string) => void>('adminSnackbar');

  const items = ref<any[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const page = ref(1);
  const limit = ref(20);
  const search = ref('');
  const dialog = ref(false);
  const deleteDialog = ref(false);
  const saving = ref(false);
  const deleting = ref(false);
  const editItem = ref<any>(null);
  const deleteTarget = ref<any>(null);
  const form = reactive<Record<string, any>>({});

  async function loadItems(extraQuery: Record<string, unknown> = {}) {
    loading.value = true;
    try {
      const res = await adminApi<any>(config.endpoint, {
        query: {
          page: page.value,
          limit: limit.value,
          title: search.value || undefined,
          ...extraQuery,
        },
      });
      items.value = res.data[config.itemsKey];
      total.value = res.data.pagination.total;
    } catch {
      snackbar?.('Ошибка загрузки', 'error');
    } finally {
      loading.value = false;
    }
  }

  function onOptionsUpdate(opts: { page: number; itemsPerPage: number }) {
    page.value = opts.page;
    limit.value = opts.itemsPerPage;
    loadItems();
  }

  function openCreate(defaults: Record<string, unknown> = {}) {
    editItem.value = null;
    Object.keys(form).forEach((k) => delete form[k]);
    Object.assign(form, defaults);
    dialog.value = true;
  }

  function openEdit(item: any) {
    editItem.value = item;
    Object.assign(form, { ...item });
    dialog.value = true;
  }

  async function save(extraBody: Record<string, unknown> = {}) {
    saving.value = true;
    try {
      const body = { ...form, ...extraBody };
      if (editItem.value) {
        await adminApi(`${config.endpoint}/${editItem.value.id}`, { method: 'PUT', body });
      } else {
        await adminApi(config.endpoint, { method: 'POST', body });
      }
      dialog.value = false;
      snackbar?.('Сохранено');
      loadItems();
    } catch (e: any) {
      snackbar?.(e.data?.error || 'Ошибка', 'error');
    } finally {
      saving.value = false;
    }
  }

  function confirmDelete(item: any) {
    deleteTarget.value = item;
    deleteDialog.value = true;
  }

  async function deleteItem() {
    deleting.value = true;
    try {
      await adminApi(`${config.endpoint}/${deleteTarget.value.id}`, { method: 'DELETE' });
      deleteDialog.value = false;
      snackbar?.('Удалено');
      loadItems();
    } catch {
      snackbar?.('Ошибка', 'error');
    } finally {
      deleting.value = false;
    }
  }

  return {
    items, total, loading, page, limit, search, dialog, deleteDialog,
    saving, deleting, form, editItem, deleteTarget,
    loadItems, onOptionsUpdate, openCreate, openEdit, save, confirmDelete, deleteItem,
  };
}
