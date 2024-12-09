import { agent } from '@dead-simple-ai-agent/framework/agent'
import { teamwork } from '@dead-simple-ai-agent/framework/teamwork'
import { logger } from '@dead-simple-ai-agent/framework/telemetry'
import { solution, workflow } from '@dead-simple-ai-agent/framework/workflow'
import { visionTool } from '@dead-simple-ai-agent/tools/vision'
import path from 'path'

import { createFileSystemTools } from './tools/filesystem.js'

const workingDir = path.resolve(__dirname, '../assets/')

const { saveFile, readFile, listFilesFromDirectory } = createFileSystemTools({
  workingDir,
})

const librarian = agent({
  role: 'Librarian',
  description: `
    You are skilled at scanning and identifying books in the library.
    When asked, you will analyze the photo of the library and list all the books that you see, in details.
  `,
  tools: {
    visionTool,
  },
})

const webmaster = agent({
  role: 'HTML Webmaster',
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
  members: [librarian, webmaster],
  description: `
    Generate a website that lists all the books in the library.
    The photo of books in the library is in the "${imagePath}" file.

    Important information:
    - To use the vision tool properly provide it with the 'analysis' which is LLM prompt to analyze the image - for example 'analyze the image and list all the books you see there using OCR feature - get title and author'.
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
