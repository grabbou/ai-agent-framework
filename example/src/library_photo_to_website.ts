import 'dotenv/config'

import { createFileSystemTools } from '@fabrice-ai/tools/filesystem'
import { visionTool } from '@fabrice-ai/tools/vision'
import { agent } from 'fabrice-ai/agent'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'
import path from 'path'

const workingDir = path.resolve(import.meta.dirname, '../assets/')

const { saveFile, readFile, listFilesFromDirectory } = createFileSystemTools({
  workingDir,
})

const librarian = agent({
  description: `
    You are skilled at scanning and identifying books in the library.
    When asked, you will analyze the photo of the library and list all the books that you see, in details.
  `,
  tools: {
    visionTool,
  },
})

const webmaster = agent({
  description: `
    You are skilled at creating HTML pages. 
    You are good at using templates for creating HTML pages.
    You can analyze existing HTML page and replace the content with the new one.
  `,
  tools: {
    saveFile,
    readFile,
    listFilesFromDirectory,
  },
})

const imagePath = path.join(workingDir, 'photo-library.jpg')
const outputPath = path.join(workingDir, 'library.html')

const bookLibraryWorkflow = workflow({
  team: { librarian, webmaster },
  description: `
    Analyze the photo of the library and list all the books in the library.
    Generate a website that lists all the books in the library.
    The photo of books in the library is in the "${imagePath}" file.

    Important information:
    - All available templates are in "${workingDir}" directory. Find the best template to use.
    - You only have access to files in "${workingDir}" directory.
    - Use absolute paths for tool calls.

  `,
  output: `
    Create a new HTML page in "${outputPath}" directory, based on the best template you found.
  `,
  snapshot: logger,
})

const result = await teamwork(bookLibraryWorkflow)

console.log(solution(result))
