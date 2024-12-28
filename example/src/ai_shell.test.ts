import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'
import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

import { aiShellWorkflow, print } from './ai_shell.config.js'

let idx = 0
export const askUserMock = tool({
  description: 'Tool for asking user a question',
  parameters: z.object({
    query: z.string().describe('The question to ask the user'),
  }),
  execute: async ({ query }, { provider }): Promise<string> => {
    const responses = ['List all files in the directory', 'I am done. Quit please.']
    const response = responses[idx]
    console.log(`😳 Mocked response: ${response}\n`)
    if (idx < responses.length) idx += 1 // stay on the last response
    return Promise.resolve(response)
  },
})

const shellExecMock = tool({
  description: 'Executes a shell command inside a Docker container. Storage path is configurable.',
  parameters: z.object({
    command: z.string().describe('The shell command to run inside the container.'),
  }),
  execute: async ({ command }) => {
    console.log(`😳 Mocked shell command call: ${command}\n`)
    return 'Executed!'
  },
})

aiShellWorkflow.team['shellOperator'].tools = {
  askUser: askUserMock,
  shellExec: shellExecMock,
  print,
}

const testResults = await testwork(
  aiShellWorkflow,
  suite({
    description: 'Black box testing suite',
    team: {
      shellOperator: [
        test('1_ask_for_command', 'There should be a tool call to "askUser" function'),
        test(
          '2_execute_command',
          'There should be a tool call to "shellExec" function or when user answers with "i want to quit" it should end the workflow'
        ),
      ],
    },
    workflow: [test('0_greeting', 'Should display greeting message first')],
  })
)

if (!testResults.passed) {
  console.log('🚨 Test suite failed')
  process.exit(-1)
} else {
  console.log('✅ Test suite passed')
  process.exit(0)
}
