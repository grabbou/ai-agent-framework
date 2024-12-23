import { createShellTools } from '@fabrice-ai/tools/shell'
import { openai } from 'fabrice-ai/providers/openai'
import * as path from 'path'

const shellTools = createShellTools({
  workingDir: path.resolve(import.meta.dirname, '../assets/'),
})

console.log(
  await shellTools.shellExec.execute(
    {
      command: 'ls -laht',
    },
    { provider: openai(), messages: [] }
  )
)
