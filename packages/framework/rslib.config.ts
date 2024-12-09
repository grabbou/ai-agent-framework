import { defineConfig } from '@rslib/core'

const entry = {
  agent: './src/agent.ts',
  models: './src/models.ts',
  teamwork: './src/teamwork.ts',
  telemetry: './src/telemetry.ts',
  tool: './src/tool.ts',
  workflow: './src/workflow.ts',
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
