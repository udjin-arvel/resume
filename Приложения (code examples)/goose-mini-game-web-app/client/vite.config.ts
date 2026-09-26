import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api/login': 'http://localhost:3000',
            '/api/rounds': 'http://localhost:3000',
        }
    }
})
