import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'

import { checkupGithubProject } from './fabrice_latest_issues.config.js'

const testResults = await testwork(
  checkupGithubProject,
  suite({
    description: 'Black box testing suite',
    team: {
    },
    workflow: [
      test('0_check_stars', 'Final report should include the overal number of star gazers'),
      test('1_check_issues', 'The report should contain list of 3 issues from Fabrice Github project'),      test('3_details', 'Should generate the report with the details of the selected project'),
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
