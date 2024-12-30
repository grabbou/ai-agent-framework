import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'
import fs from 'fs'

import { githubProjectReport, outputPath, workingDir } from './github_docx_report.config.js'

const testResults = await testwork(
  githubProjectReport,
  suite({
    description: 'Black box testing suite',
    team: {
      browser: [
        test(
          '0_github_check',
          'Browser agent shoud use the "httpTool" to browse Github for project details'
        ),
      ],
      reportCreator: [
        test(
          '1_file_operations',
          `The reportCreator agent is using saveFile, readFile or convertFileWithPandoc tools to operate only within the ${workingDir} directory`
        ),
      ],
    },
    workflow: [
      test('2_finalOutput', `Final report saved to ${outputPath} file`, async (workflow, state) => {
        if (!fs.existsSync(outputPath)) {
          return {
            passed: false,
            reasoning: `Output file ${outputPath} does not exist`,
            id: '2_finalOutput',
          }
        } else {
          return {
            passed: true,
            reasoning: 'Output file saved correctly',
            id: '2_finalOutput',
          }
        }
      }),
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
