import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'

import { randomJokesScriptWorkflow } from './python_random_jokes.config.js'

const testResults = await testwork(
  randomJokesScriptWorkflow,
  suite({
    description: 'Black box testing suite',
    team: {
      coder: [test('2_jokes', 'Two jokes should be generated and passed within the Python code')],
      runner: [
        test(
          '1_interpreter',
          'The "codeInterpreter" tool should be called once to run the Python script'
        ),
      ],
    },
    workflow: [
      test('2_final_result', `As a final result there should be one joke returned as a string`),
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
