<template>
    <div class="dialog-modal confirm-modal">
        <div class="confirm-modal__text pt-3 pb-3 mb-3" v-show="data.msg" v-html="data.msg"></div>
        <div class="confirm-modal__buttons d-grid gap-2">
            <button class="btn btn-primary" type="button" @click="confirm(true)">
                {{ data.yes }}
            </button>
            <button class="btn btn-outline-secondary" type="button" v-show="data.no" @click="confirm(false)">
                {{ data.no }}
            </button>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'DialogModal',

    props: {
        data: {
            type: Object,
            required: true,
        }
    },

    methods: {
        confirm(isConfirmed) {
            if (isConfirmed && typeof this.data.callback === 'function') {
                this.data.callback();
            }
            
            this.$emit('closeModal');
        }
    },
});
</script>
