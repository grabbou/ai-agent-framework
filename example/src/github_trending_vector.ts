import 'dotenv/config'

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

const { saveDocumentInVectorStore, searchInVectorStore } = createVectorStoreTools()

const { firecrawl } = createFireCrawlTool({
  apiKey,
})

const githubResearcher = agent({
  description: `
    You are skilled at browsing Github pages.
    You are saving the documents to vector store for later usage.
    You don't do any other thing just these two tasks.
  `,
  tools: {
    firecrawl,
    saveDocumentInVectorStore,
  },
})

const wrapupRedactor = agent({
  description: `
    You ask users for which topic to focus on if it's defined in the task.
    Then - you search relevant information in Vector Store and compile reports based on it.
    You're famous of beautiful Markdown formatting.
  `,
  tools: {
    askUser,
    searchInVectorStore,
  },
})

const wrapUpTrending = workflow({
  team: { githubResearcher, wrapupRedactor },
  description: `
    Research the URL "https://github.com/trending/typescript" page using firecrawl tool
    Select 3 top projects. Browse for details about these projects on their subpages. 
    Save it all to the vector store.

    Ask user about which project he wants to learn more.
    reate a comprehensive report markdown output:
     - create a one, two sentence summary about every project.
     - include detailed summary about the project selected by the user.

    Here are some ground rules to follow: 
      - Browser the pages onle once and store content in Vector Store. 
      - Use Vector Store if you need information about the project.
      - Before making up the record: ask user about which project he wants to learn more.
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
