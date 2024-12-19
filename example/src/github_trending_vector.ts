import 'dotenv/config'

import { createFireCrawlTool } from '@fabrice-ai/tools/firecrawl'
import { getApiKey } from '@fabrice-ai/tools/utils'
import { createVectorStoreTools } from '@fabrice-ai/tools/vector'
import { agent } from 'fabrice-ai/agent'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'

import { askUser } from './tools/askUser.js'

const apiKey = await getApiKey('Firecrawl.dev API Key', 'FIRECRAWL_API_KEY')

const { saveDocumentInVectorStore, searchInVectorStore } = createVectorStoreTools()

const { firecrawl } = createFireCrawlTool({
  apiKey,
})

const webCrawler = agent({
  description: `
    You are skilled at browsing Web pages.
    You can save the documents to Vector store for later usage.
  `,
  tools: {
    firecrawl,
    saveDocumentInVectorStore,
  },
})

const human = agent({
  description: `
    You can ask user and get their answer to questions that are needed by other agents.
  `,
  tools: {
    askUser,
  },
})

const reportCompiler = agent({
  description: `
    You can create a comprehensive report based on the information from Vector store.
    You're famous for beautiful Markdown formatting.
  `,
  tools: {
    searchInVectorStore,
  },
})

const wrapUpTrending = workflow({
  team: { webCrawler, human, reportCompiler },
  description: `
    Research the "https://github.com/trending/typescript" page.
    Select 3 top projects. 
    For each project, browse details about it on their subpages.
    Store each page in Vector store for later usage.
  
    Ask user about which project he wants to learn more.
   `,
  knowledge: `
    Each document in Vector store is a page from the website.
  `,
  output: `
    Create a comprehensive markdown report:
     - create a one, two sentences summary about every project.
     - include detailed summary about the project selected by the user. 
  `,
  snapshot: logger,
})

const result = await teamwork(wrapUpTrending)

console.log(solution(result))
