import { createFireCrawlTool } from '@fabrice-ai/tools/firecrawlScrape'
import { getApiKey } from '@fabrice-ai/tools/utils'
import { agent } from 'fabrice-ai/agent'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
import { solution, workflow } from 'fabrice-ai/workflow'

const apiKey = await getApiKey('Firecrawl.dev API Key', 'FIRECRAWL_API_KEY')

const { firecrawlScrape } = createFireCrawlTool({
  apiKey,
})

const githubResearcher = agent({
  role: 'Github Researcher',
  description: `
    You are skilled at browsing what's hot on Github trending page.
  `,
  tools: {
    firecrawlScrape,
  },
})

const wrapupRedactor = agent({
  role: 'Redactor',
  description: `
    Your role is to wrap up reports.
    You're famous of beautiful Markdown formatting.
  `,
})

const wrapUpTrending = workflow({
  members: [githubResearcher, wrapupRedactor],
  description: `
    Research the URL "https://github.com/trending/python" page using scraper tool
    Get 3 top projects. You can get the title and description from the project page.
    Then summarize it all into a comprehensive report markdown output.

    Here are some ground rules to follow: 
      - Include one sentence summary for each project.
  `,
  output: `
    Comprehensive markdown report with the top trending python projects.
  `,
  snapshot: logger,
})

const result = await teamwork(wrapUpTrending)

console.log(solution(result))
