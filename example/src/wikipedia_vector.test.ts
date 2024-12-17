import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'

import { wikipediaResearch } from './wikipedia_vector.workflow.js'

const testResults = await testwork(
  wikipediaResearch,
  suite({
    description: 'Black box testing suite',
    team: {
      wikipediaIndexer: [
        test('0_wikipedia', 'Should use "wikipediaTool" and "saveDocumentInVectorStore"'),
      ],
    },
    workflow: [
      test(
        '1_check_the_story',
        'There should be a short report about John III Sobieski education and dates of reign as King of Poland'
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
