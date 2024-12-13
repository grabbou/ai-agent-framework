import 'dotenv/config'

import { createFireCrawlTool } from '@fabrice-ai/tools/firecrawl'
import { getApiKey } from '@fabrice-ai/tools/utils'
import { agent } from 'fabrice-ai/agent'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'

const apiKey = await getApiKey('Firecrawl.dev API Key', 'FIRECRAWL_API_KEY')

const { firecrawl } = createFireCrawlTool({
  apiKey,
})

const githubResearcher = agent({
  description: `
    You are skilled at browsing what's hot on Github trending page.
  `,
  tools: {
    firecrawl,
  },
})

const wrapupRedactor = agent({
  description: `
    Your role is to compile and summarize information.
    You're great at creating a wrap-up reports.
    You're famous of beautiful Markdown formatting.
  `,
})

const wrapUpTrending = workflow({
  team: { githubResearcher, wrapupRedactor },
  description: `
    Research the URL "https://github.com/trending/typescript" page using firecrawl tool
    Summarize information about 3 top projects into a comprehensive report markdown output.

    Here are some ground rules to follow: 
      - Include one sentence summary for each project.
  `,
  output: `
    Comprehensive markdown report with the top trending typescript projects.
  `,
  snapshot: logger,
})

const result = await teamwork(wrapUpTrending)

console.log(solution(result))
