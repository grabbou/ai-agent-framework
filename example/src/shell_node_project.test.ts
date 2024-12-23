import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'
import fs from 'fs'
import path from 'path'

import { workingDir } from './library_photo_to_website.config.js'
import { createHelloworldNodeProject, workingDir } from './shell_node_project.config.js'

const testResults = await testwork(
  createHelloworldNodeProject,
  suite({
    description: 'Black box testing suite',
    team: {},
    workflow: [
      test('0_folders', 'App should work inside the nodejs-app directory'),
      test(
        '1_required_packages',
        `Required packages should be installed using "apk" command - specifically nodejs, npm`
      ),

      test('2_output', `Hello world + <random number> should be displayed as a final result`),
      test(
        '3_script',
        `The generated file sould include "console.log" call in the ${path.join(workingDir, 'nodejs-app', 'index.js')} file`,
        async (workflow, state) => {
          const outputPath = path.join(workingDir, 'nodejs-app', 'index.js')
          if (!fs.existsSync(outputPath)) {
            return {
              passed: false,
              reasoning: `Output file ${outputPath} does not exist`,
              id: '3_script',
            }
          }
          const htmlContent = fs.readFileSync(outputPath, 'utf-8')
          return {
            reasoning: 'Output file includes the console.log call',
            passed: htmlContent.includes('console.log'),
            id: '3_script',
          }
        }
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
