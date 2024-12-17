import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'

import { wrapUpTrending } from './github_trending_vector.workflow.js'

const testResults = await testwork(
  wrapUpTrending,
  suite({
    description: 'Black box testing suite',
    team: {
      webCrawler: [test('0_webCrawler', 'Should use "firecrawl" and "saveDocumentInVectorStore"')],
    },
    workflow: [
      test('1_check_the_list', 'Should find 3 trending projects on Github'),
      test('2_check_the_list', 'Should ask the user for one of these projects'),
      test('3_details', 'Should generate the report with the details of the selected project'),
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
