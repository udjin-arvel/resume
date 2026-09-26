<template>
  <section class="border-t border-white/5 pt-8">
    <p class="md-section-title mb-5">
      Комментарии ({{ comments.length }})
    </p>

    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Удаление комментария"
      message="Вы уверены, что хотите удалить этот комментарий?"
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteComment"
    />

    <!-- Add comment -->
    <div v-if="isAuthenticated" class="mb-6">
      <div class="md-field">
        <textarea
          v-model="newComment"
          placeholder="Написать комментарий..."
          class="md-input resize-none"
          rows="3"
          :disabled="isSubmittingComment"
        />
      </div>
      <div class="mt-3 flex justify-end">
        <button
          type="button"
          :disabled="!newComment.trim() || isSubmittingComment"
          class="md-btn-filled"
          @click="addComment"
        >
          {{ isSubmittingComment ? 'Отправка...' : 'Отправить' }}
        </button>
      </div>
    </div>

    <!-- Comments list -->
    <div v-if="comments.length > 0" class="space-y-4">
      <article
        v-for="comment in comments"
        :key="comment.id"
        class="bg-black border border-beige/40 rounded-lg p-4"
      >
        <div class="flex justify-between items-start gap-3 mb-3">
          <div class="text-beige/90 font-medium text-sm">
            {{ comment.user?.login }}
          </div>
          <div v-if="canEditComment(comment)" class="flex items-center gap-4 shrink-0">
            <button
              v-if="editingCommentId !== comment.id"
              type="button"
              class="text-beige text-sm hover:text-beige/80 hover:underline transition-colors focus:outline-none"
              @click="startEditComment(comment)"
            >
              Редактировать
            </button>
            <button
              type="button"
              class="text-reder text-sm hover:text-red transition-colors focus:outline-none"
              @click="deleteComment(comment.id)"
            >
              Удалить
            </button>
          </div>
        </div>

        <!-- Edit mode -->
        <div v-if="editingCommentId === comment.id">
          <textarea
            v-model="editingCommentText"
            class="md-input resize-none"
            rows="3"
          />
          <div class="mt-3 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              class="md-btn-text"
              @click="cancelEditComment"
            >
              Отмена
            </button>
            <button
              type="button"
              :disabled="!editingCommentText.trim()"
              class="md-btn-filled"
              @click="saveEditComment(comment.id)"
            >
              Сохранить
            </button>
          </div>
        </div>

        <!-- Display mode -->
        <template v-else>
          <p class="text-white/90 text-sm leading-relaxed mb-2">
            {{ comment.text }}
          </p>
          <div class="text-right text-on-surface-muted text-xs">
            {{ formatDate(comment.createdAt) }}
          </div>
        </template>
      </article>
    </div>

    <div v-else class="text-center text-on-surface-muted py-10 text-sm">
      Комментариев пока нет
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  contentType: {
    type: String,
    required: true
  },
  contentId: {
    type: Number,
    required: true
  }
});

const { api } = useApi();
const authStore = useAuthStore();

const comments = ref([]);
const newComment = ref('');
const isSubmittingComment = ref(false);
const editingCommentId = ref(null);
const editingCommentText = ref('');
const showDeleteConfirm = ref(false);
const commentToDelete = ref(null);

const isAuthenticated = computed(() => authStore.isAuthenticated);

const fetchComments = async () => {
  try {
    const response = await api(`/comments/content/${props.contentType}/${props.contentId}`);
    if (response.success && response.data?.comments) {
      comments.value = response.data.comments;
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
};

const canEditComment = (comment) => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin || authStore.isModerator) return true;
  return comment.userId === authStore.user?.id;
};

const addComment = async () => {
  if (!newComment.value.trim() || isSubmittingComment.value) return;

  isSubmittingComment.value = true;
  try {
    const response = await api('/comments', {
      method: 'POST',
      body: {
        text: newComment.value,
        contentId: props.contentId,
        contentType: props.contentType
      }
    });

    if (response.success && response.data) {
      comments.value.unshift(response.data);
      newComment.value = '';
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  } finally {
    isSubmittingComment.value = false;
  }
};

const startEditComment = (comment) => {
  editingCommentId.value = comment.id;
  editingCommentText.value = comment.text;
};

const cancelEditComment = () => {
  editingCommentId.value = null;
  editingCommentText.value = '';
};

const saveEditComment = async (commentId) => {
  if (!editingCommentText.value.trim()) return;

  try {
    const response = await api(`/comments/${commentId}`, {
      method: 'PUT',
      body: { text: editingCommentText.value }
    });

    if (response.success && response.data) {
      const index = comments.value.findIndex(c => c.id === commentId);
      if (index !== -1) {
        comments.value[index] = response.data;
      }
      cancelEditComment();
    }
  } catch (error) {
    console.error('Error updating comment:', error);
  }
};

const deleteComment = (commentId) => {
  commentToDelete.value = commentId;
  showDeleteConfirm.value = true;
};

const confirmDeleteComment = async () => {
  if (!commentToDelete.value) return;

  try {
    const response = await api(`/comments/${commentToDelete.value}`, {
      method: 'DELETE'
    });

    if (response.success) {
      comments.value = comments.value.filter(c => c.id !== commentToDelete.value);
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
  } finally {
    commentToDelete.value = null;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

defineExpose({
  fetchComments
});

onMounted(() => {
  fetchComments();
});
</script>
