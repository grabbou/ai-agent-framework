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
    You are saving the documents to vector store for later usage.
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
    You can search Vector Store to find relevant informations and create reports based on it
    Based on the information from Vector Store you can compile a comprehensive report.
    You're famous of beautiful Markdown formatting.
  `,
  tools: {
    searchInVectorStore,
  },
})

const wrapUpTrending = workflow({
  team: { webCrawler, human, reportCompiler },
  description: `
    Research the URL "https://github.com/trending/typescript" page.
    Select 3 top projects. Browse details about these projects on their subpages.
    Store each page in Vector Store for further usage.
    After you store the information you don't need to browse the page again 
    because everything is stored in Vector Store.

    Ask user about which project he wants to learn more. Ask user only once.
  `, 
  knowledge: `
    Create a comprehensive markdown report using information from Vector Store, based on user selection:
     - create a one, two sentence summary about every project.
     - include detailed summary about the project selected by the user.

    Here are some ground rules to follow: 
      - Use Vector Store if you need information about the project.
  `,
  output: `
    Comprehensive markdown report including:
    - summary on top trending Typescript projects.
    - detailed info about the project selected by the user.
  `,
  snapshot: logger,
})

const result = await teamwork(wrapUpTrending)

console.log(solution(result))
