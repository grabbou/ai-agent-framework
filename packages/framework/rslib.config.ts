import path from 'node:path'

import { defineConfig } from '@rslib/core'

export default defineConfig({
  source: {
    entry: {
      agent: './src/agent.ts',
      models: './src/models.ts',
      teamwork: './src/teamwork.ts',
      telemetry: './src/telemetry.ts',
      tool: './src/tool.ts',
      workflow: './src/workflow.ts',
    },
  },
  lib: [
    {
      format: 'esm',
      output: {
        distPath: {
          root: 'dist',
        },
      },
    },
    {
      format: 'cjs',
      output: {
        distPath: {
          root: 'dist',
        },
      },
    },
  ],
})
