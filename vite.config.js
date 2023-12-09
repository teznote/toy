import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'src/builder.js',
      },
      output: {
        format: 'esm',
        file: 'src/builder-bundled.js',
      }
    },
  },
})