import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    {
      source: {
        entry: './src/index.ts',
      },
      format: 'esm',
      bundle: false,
      output: {
        distPath: {
          root: 'dist',
        },
      },
    },
  ],
})
