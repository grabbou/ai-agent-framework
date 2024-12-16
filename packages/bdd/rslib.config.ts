import { defineConfig } from '@rslib/core'

const entry = {
  testwork: './src/testwork.ts',
}

export default defineConfig({
  lib: [
    {
      source: {
        entry,
      },
      format: 'esm',
      bundle: false,
      output: {
        distPath: {
          root: 'dist',
        },
      },
    },
    {
      source: {
        entry,
      },
      format: 'cjs',
      bundle: false,
      output: {
        distPath: {
          root: 'dist',
        },
      },
    },
  ],
})
