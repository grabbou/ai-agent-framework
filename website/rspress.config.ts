import * as path from 'node:path'

import { defineConfig } from 'rspress/config'
// import { pluginTypeDoc } from '@rspress/plugin-typedoc'
import ghPages from 'rspress-plugin-gh-pages'

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Fabrice',
  icon: '/rspress-icon.png',
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
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
    ghPages({
      repo: 'https://github.com/callstackincubator/fabrice-ai.git',
      branch: 'website',
    }),
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
  ],
})
