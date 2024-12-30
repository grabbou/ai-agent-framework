import 'dotenv/config'

import { createFileSystemTools } from '@fabrice-ai/tools/filesystem'
import { httpTool } from '@fabrice-ai/tools/http'
import { createPandocTool } from '@fabrice-ai/tools/pandoc'
import { agent } from 'fabrice-ai/agent'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'
import fs from 'fs'
import path from 'path'

import { askUser } from './tools/askUser.js'

export const workingDir = path.resolve(import.meta.dirname, '../assets/')
const filesToCleanup = ['project-summary.docx', 'project-summary.md']
for (const file in filesToCleanup) {
  if (fs.existsSync(path.join(workingDir, file))) fs.rmSync(path.join(workingDir, file))
}

export const outputPath = path.join(workingDir, 'project-summary.docx')

const human = agent({
  description: `
  Use askUser tool to get the required input information for other agents`,
  tools: {
    askUser,
  },
})

const browser = agent({
  description: `
    You are skilled at browsing Web with specified URLs, 
    methods, params etc.
    You are using "httpTool" to get the data from the API and/or Web pages.
  `,
  tools: {
    httpTool,
  },
})

const fsTools = createFileSystemTools({
  workingDir,
})

const reportCreator = agent({
  description: `
    Your role is to create a project report and save it in Microsfot Office, "docx" file.
    I am able to read, save and convert documents and files using my toolkit.
  `,
  tools: {
    convertFileWithPandoc: createPandocTool({
      workingDir,
    }).convertFileWithPandoc,
    saveFile: fsTools.saveFile,
    readFile: fsTools.readFile,
  },
})

export const githubProjectReport = workflow({
  team: { human, browser, reportCreator },
  description: `
    Ask human for the Github project locator: "<organization>/<project-handle>".
    Browse the following URL: "https://api.github.com/repos/<organization>/<project-handle>".

    Create a Markdown report about the most important project information.
    Convert this report to "docx" - Word format - and save in the "${outputPath}" file.
  `,
  knowledge: `
    Save files in the ${workingDir} only.
  `,
  output: `
   Comprehensive Github project raport:
    - Returned in theMarkdown format,
    - Saved, in "docx" format in the "${outputPath}",
    - Keep strict to output file name: "${outputPath}"
  `,
  snapshot: logger,
})
