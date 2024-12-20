import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'

import { wrapUpTheNewsWorkflow } from './news_wrap_up.config.js'

const testResults = await testwork(
  wrapUpTheNewsWorkflow,
  suite({
    description: 'Black box testing suite',
    team: {
      newsResearcher: [
        test('1_currentDate', 'Should use "getCurrentDate" tool'),
        test('2_googleSearch', 'Should use "googleSearch" tool'),
      ],
    },
    workflow: [
      test(
        '3_newsReasearcher',
        'The newsResearcher agent should take the current date and search for the news from the last week'
      ),
      test(
        '4_wrapUpRedactor',
        'Wrap up redactor should be used to compile the markdown report with the listing including top news headlines for the last week'
      ),
      test(
        '5_finalOutput',
        'Final output should be a markdown report with the listing of top news headlines'
      ),
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
