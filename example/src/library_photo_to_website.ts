import { agent } from '@dead-simple-ai-agent/framework/agent'
import { teamwork } from '@dead-simple-ai-agent/framework/teamwork'
import { logger } from '@dead-simple-ai-agent/framework/telemetry'
import { solution, workflow } from '@dead-simple-ai-agent/framework/workflow'
import { visionTool } from '@dead-simple-ai-agent/tools/vision'
import path from 'path'

import { listFiles, readFile, saveFile } from './tools/fsTools.js'

const librarian = agent({
  role: 'Librarian',
  description: `
    You are skilled at scanning and identifying books in the library.
    You look at the book library and automatically list all the books including 
    Title and author saving the result to a JSON file.
  `,
  tools: {
    visionTool,
    saveFile: saveFile({
      workingDir: path.resolve(__dirname, '../assets/'),
    }),
  },
})

const webmaster = agent({
  role: 'HTML Webmaster',
  description: `
    You are skilled at creating HTML pages. 
    You can create a simple HTML page with the list of items (books etc) 
    from the JSON database.
    You are good at finding and using templates for creating HTML pages.
    You are scanning the folder looking for assets and then bunding it all together.
  `,
  tools: {
    saveFile: saveFile({
      workingDir: path.resolve(__dirname, '../assets/'),
    }),
    readFile: readFile({
      workingDir: path.resolve(__dirname, '../assets/'),
    }),
    listFiles: listFiles({
      workingDir: path.resolve(__dirname, '../assets/'),
    }),
  },
})

const imagePath = path.resolve(__dirname, '../assets/photo-library.jpg')
const bookLibraryWorkflow = workflow({
  members: [librarian, webmaster],
  description: `
    Analyze the photo located in '${imagePath}' and list ALL the books. 
    Your working directory is: '${path.resolve(__dirname, '../assets/')}'.
    Use absolute paths for tool calls - within this directory.
    There is about 10 books in the photo.
    Create a JSON database with the list of books and save it to file.
    Create a simple HTML page based on a *.html template found in the directory.
    Save the result to HTML file.

    Important information:
    - a HTML template is somewhere in the folder '.'
    - the photo of books is located in the './assets/photo-library
  `,
  output: `
    HTML page saved under 'library.html' with the list of books from the library.
  `,
  snapshot: logger,
})

const result = await teamwork(bookLibraryWorkflow)

console.log(solution(result))
