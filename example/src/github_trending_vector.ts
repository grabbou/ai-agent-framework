import { createFireCrawlTool } from '@fabrice-ai/tools/firecrawl'
import { getApiKey } from '@fabrice-ai/tools/utils'
import { createVectorStoreTools } from '@fabrice-ai/tools/vector'
import { agent } from 'fabrice-ai/agent'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
import { tool } from 'fabrice-ai/tool'
import { workflow } from 'fabrice-ai/workflow'
import { z } from 'zod'

import { askUser } from './tools/askUser.js'

const apiKey = await getApiKey('Firecrawl.dev API Key', 'FIRECRAWL_API_KEY')

const printTool = tool({
  description: 'Display information to the user',
  parameters: z.object({
    message: z.string().describe('The information to be displayed'),
  }),
  execute: async ({ message }) => {
    console.log(message)
    return ''
  },
})

const { saveDocumentInVectorStore, searchInVectorStore } = createVectorStoreTools()

const { firecrawl } = createFireCrawlTool({
  apiKey,
})

const githubResearcher = agent({
  description: `
    You are skilled at browsing what's hot on Github trending page.
    You are saving the documents to vector store for later usage
  `,
  tools: {
    firecrawl,
    saveDocumentInVectorStore,
  },
})

const wrapupRedactor = agent({
  description: `
    Your role is to wrap up reports.
    You ask users for which topic to focus on if it's defined in the task.
    You're famous of beautiful Markdown formatting.
  `,
  tools: {
    printTool,
    askUser,
    searchInVectorStore,
  },
})

const wrapUpTrending = workflow({
  team: { githubResearcher, wrapupRedactor },
  description: `
    Research the URL "https://github.com/trending/typescript" page using scraper tool
    Get 3 top projects. You can get the title and description from the project page.
    Then summarize it all into a comprehensive report markdown output.

    Ask user about which project he wants to learn more.
    Search for the project in the vector store and provide more details in the report.

    Here are some ground rules to follow: 
      - Include one sentence summary for each project.
      - Print the list of projects to the user.
      - Ask user about which project he wants to learn more.
      - Display more information about this specific project from the vector store.
  `,
  output: `
    Comprehensive markdown report with the top trending Typescript projects.
    Detailed report about the project selected by the user.
  `,
  snapshot: logger,
})

const result = await teamwork(wrapUpTrending)

console.log(solution(result))
