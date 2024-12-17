import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/*.ts'],
  format: ['esm'],
  target: 'node20',
  splitting: false,
  clean: true,
})
