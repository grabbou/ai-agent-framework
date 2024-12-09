import * as path from 'node:path'

import { pluginTypeDoc } from '@rspress/plugin-typedoc'
import { defineConfig } from 'rspress/config'
// import { pluginTypeDoc } from '@rspress/plugin-typedoc'

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Dead Simple AI Agent',
  icon: '/rspress-icon.png',
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
  globalStyles: path.join(__dirname, 'global.css'),
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/callstackincubator/ai-agent-framework',
      },
    ],
  },
  plugins: [
<<<<<<< HEAD
    pluginTypeDoc({
      entryPoints: [
        path.join(__dirname, '../packages/framework/src/agent.ts'),
        path.join(__dirname, '../packages/framework/src/teamwork.ts'),
        path.join(__dirname, '../packages/framework/src/tool.ts'),
        path.join(__dirname, '../packages/framework/src/workflow.ts'),
        path.join(__dirname, '../packages/framework/src/models/openai.ts'),
        path.join(__dirname, '../packages/framework/src/telemetry.ts'),
      ],
    }),
=======
    // pluginTypeDoc({
    //   entryPoints: [
    //     path.join(__dirname, '../packages/framework/src/agent.ts'),
    //     path.join(__dirname, '../packages/framework/src/teamwork.ts'),
    //     path.join(__dirname, '../packages/framework/src/tool.ts'),
    //     path.join(__dirname, '../packages/framework/src/workflow.ts'),
    //     path.join(__dirname, '../packages/framework/src/models/openai.ts'),
    //     path.join(__dirname, '../packages/framework/src/telemetry.ts'),
    //   ],
    // }),
>>>>>>> main
  ],
})
