import { defineStore } from 'pinia';

interface Story {
  id: number
  title: string
  type: string
  chapter?: number
  epigraph?: string
  user: { id: number; login: string }
  composition?: { id: number; title: string }
  fragments: Array<{ id: number; text: string; order: number }>
  createdAt: string
  updatedAt: string
}

interface Notion {
  id: number
  title: string
  text: string
  type: string
  poster?: string
  user: { id: number; login: string }
  images: Array<{ id: number; path: string; title?: string }>
  createdAt: string
  updatedAt: string
}

interface Note {
  id: number
  title: string
  text: string
  importance: number
  price: number
  isContent: boolean
  user: { id: number; login: string }
  images: Array<{ id: number; path: string; title?: string }>
  createdAt: string
  updatedAt: string
}

interface LoreItem {
  id: number
  title: string
  text: string
  poster?: string
  user: { id: number; login: string }
  images: Array<{ id: number; path: string; title?: string }>
  createdAt: string
  updatedAt: string
}

interface Composition {
  id: number
  title: string
  description?: string
  type: string
  poster?: string
  user: { id: number; login: string }
  stories: Array<{ id: number; title: string; chapter?: number; type: string }>
  createdAt: string
  updatedAt: string
}

interface ContentState {
  stories: Story[]
  notions: Notion[]
  notes: Note[]
  loreItems: LoreItem[]
  compositions: Composition[]
  loading: boolean
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  } | null
}

export const useContentStore = defineStore('content', {
  state: (): ContentState => ({
    stories: [],
    notions: [],
    notes: [],
    loreItems: [],
    compositions: [],
    loading: false,
    pagination: null
  }),

  getters: {
    getStoryById: (state) => (id: number) => state.stories.find(story => story.id === id),
    getNotionById: (state) => (id: number) => state.notions.find(notion => notion.id === id),
    getNoteById: (state) => (id: number) => state.notes.find(note => note.id === id),
    getLoreItemById: (state) => (id: number) => state.loreItems.find(item => item.id === id),
    getCompositionById: (state) => (id: number) => state.compositions.find(comp => comp.id === id),
  },

  actions: {
    // Stories
    async fetchStories(filters = {}) {
      this.loading = true;
      try {
        const response = await $fetch('/api/stories', { query: filters });
        if (response.success) {
          this.stories = response.data.stories;
          this.pagination = response.data.pagination;
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchStory(id: number) {
      try {
        const response = await $fetch(`/api/stories/${id}`);
        if (response.success) {
          const index = this.stories.findIndex(s => s.id === id);
          if (index !== -1) {
            this.stories[index] = response.data;
          } else {
            this.stories.push(response.data);
          }
          return response.data;
        }
      } catch (error) {
        console.error('Error fetching story:', error);
      }
    },

    // Notions
    async fetchNotions(filters = {}) {
      this.loading = true;
      try {
        const response = await $fetch('/api/notions', { query: filters });
        if (response.success) {
          this.notions = response.data.notions;
          this.pagination = response.data.pagination;
        }
      } catch (error) {
        console.error('Error fetching notions:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchNotion(id: number) {
      try {
        const response = await $fetch(`/api/notions/${id}`);
        if (response.success) {
          const index = this.notions.findIndex(n => n.id === id);
          if (index !== -1) {
            this.notions[index] = response.data;
          } else {
            this.notions.push(response.data);
          }
          return response.data;
        }
      } catch (error) {
        console.error('Error fetching notion:', error);
      }
    },

    // Notes
    async fetchNotes(filters = {}) {
      this.loading = true;
      try {
        const response = await $fetch('/api/notes', { query: filters });
        if (response.success) {
          this.notes = response.data.notes;
          this.pagination = response.data.pagination;
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchNote(id: number) {
      try {
        const response = await $fetch(`/api/notes/${id}`);
        if (response.success) {
          const index = this.notes.findIndex(n => n.id === id);
          if (index !== -1) {
            this.notes[index] = response.data;
          } else {
            this.notes.push(response.data);
          }
          return response.data;
        }
      } catch (error) {
        console.error('Error fetching note:', error);
      }
    },

    // Lore Items
    async fetchLoreItems(filters = {}) {
      this.loading = true;
      try {
        const response = await $fetch('/api/lore', { query: filters });
        if (response.success) {
          this.loreItems = response.data.loreItems;
          this.pagination = response.data.pagination;
        }
      } catch (error) {
        console.error('Error fetching lore items:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchLoreItem(id: number) {
      try {
        const response = await $fetch(`/api/lore/${id}`);
        if (response.success) {
          const index = this.loreItems.findIndex(l => l.id === id);
          if (index !== -1) {
            this.loreItems[index] = response.data;
          } else {
            this.loreItems.push(response.data);
          }
          return response.data;
        }
      } catch (error) {
        console.error('Error fetching lore item:', error);
      }
    },

    // Compositions
    async fetchCompositions(filters = {}) {
      this.loading = true;
      try {
        const response = await $fetch('/api/compositions', { query: filters });
        if (response.success) {
          this.compositions = response.data.compositions;
          this.pagination = response.data.pagination;
        }
      } catch (error) {
        console.error('Error fetching compositions:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchComposition(id: number) {
      try {
        const response = await $fetch(`/api/compositions/${id}`);
        if (response.success) {
          const index = this.compositions.findIndex(c => c.id === id);
          if (index !== -1) {
            this.compositions[index] = response.data;
          } else {
            this.compositions.push(response.data);
          }
          return response.data;
        }
      } catch (error) {
        console.error('Error fetching composition:', error);
      }
    },

    // Search
    async searchNotions(query: string) {
      try {
        const response = await $fetch('/api/notions/search', { query: { q: query } });
        if (response.success) {
          return response.data;
        }
      } catch (error) {
        console.error('Error searching notions:', error);
      }
      return [];
    },

    // Clear state
    clearContent() {
      this.stories = [];
      this.notions = [];
      this.notes = [];
      this.loreItems = [];
      this.compositions = [];
      this.pagination = null;
    }
  }
}); 