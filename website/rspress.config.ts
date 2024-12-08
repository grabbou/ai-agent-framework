import * as path from 'node:path'

// @ts-ignore
import { defineConfig } from 'rspress/config'
// import { pluginTypeDoc } from '@rspress/plugin-typedoc'

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'My Site',
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
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
  },
  plugins: [
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
