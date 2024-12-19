import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/**/*.ts'],
  format: ['cjs', 'esm'],
  target: 'node20',
  splitting: false,
  clean: true,
  dts: true,
})
