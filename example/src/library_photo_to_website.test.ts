import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'
import fs from 'fs/promises'

import { bookLibraryWorkflow, outputPath, workingDir } from './library_photo_to_website.workflow.js'

const testResults = await testwork(
  bookLibraryWorkflow,
  suite({
    description: 'Black box testing suite',
    team: {
      librarian: [
        test(
          '1_vision',
          'Librarian should use the vision tool to OCR the photo of the book library to text'
        ),
      ],
      webmaster: [
        test(
          '2_listFilesFromDirectory',
          'Webmaster should list the files from working directory using "listFilesFromDirectory" tool'
        ),
        test(
          '3_saveFile',
          `Webmaster should modify and save final HTML to ${outputPath} file using "saveFile" tool`
        ),
      ],
    },
    workflow: [
      test(
        '4_search_template',
        `Webmaster should search and MUST choose the "book_library_template.html" template from inside the ${workingDir} directory.`
      ),
      test(
        '5_finalOutput',
        'Final list of the books should be at least 5 books long and saved to the HTML file'
      ),
      test(
        '6_finalOutput',
        `Final output consist "Female Masculinity" title in the ${outputPath} file`,
        async (workflow, state) => {
          const htmlContent = await fs.readFile(outputPath, 'utf-8')
          return {
            reasoning: "Output file includes the 'Female Masculinity' title",
            passed: htmlContent.includes('Female Masculinity'),
            id: '6_finalOutput',
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
