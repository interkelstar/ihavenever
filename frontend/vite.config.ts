import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: '/v2-static/',
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:80',
                changeOrigin: true
            },
            '/room': {
                target: 'http://localhost:80',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: '../src/main/resources/static/v2-static',
        emptyOutDir: true
    }
})
