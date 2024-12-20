import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'
import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

import { preVisitNoteWorkflow } from './medical_survey.config.js'

export const askUserMock = tool({
  description: 'Tool for asking user a question',
  parameters: z.object({
    query: z.string().describe('The question to ask the user'),
  }),
  execute: async ({ query }, { provider }): Promise<string> => {
    const response = await provider.chat({
      messages: [
        {
          role: 'system',
          content: `We are role playing - a nurse is asking a patient about their symptoms
          and the patient is answering. The nurse will ask you a question and you should answer it.
          Figure out something realistic! It's just a play!`,
        },
        {
          role: 'user',
          content: 'Try to answer this question in a single line: ' + query,
        },
      ],
      response_format: {
        result: z.object({
          answer: z.string().describe('Answer to the question'),
        }),
      },
    })
    console.log(`😳 Mocked response: ${response.value.answer}\n`)
    return Promise.resolve(response.value.answer)
  },
})

preVisitNoteWorkflow.team['nurse'].tools = {
  askPatient: askUserMock,
}

const testResults = await testwork(
  preVisitNoteWorkflow,
  suite({
    description: 'Automated testing suite for med journey',
    team: {
      nurse: [
        test(
          '0_askPatient',
          'Should ask question - the patient should answer. Check if the question was asked and answer provided. Do not analyze the content.'
        ),
      ],
    },
    workflow: [
      test('1_questionare', 'Should ask up to 5 questions to the user and wait for the results'),
      test('2_diagnosis', 'Should compile the pre-visit report the patient based on the answers'),
    ],
  })
)
if (!testResults.passed) {
  console.log('🚨 Test suite failed')
  process.exit(-1)
} else {
  console.log('✅ Test suite passed')
  process.exit(0)
}
