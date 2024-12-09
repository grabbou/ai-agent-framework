import { agent } from '@dead-simple-ai-agent/framework/agent'
import { teamwork } from '@dead-simple-ai-agent/framework/teamwork'
import { logger } from '@dead-simple-ai-agent/framework/telemetry'
import { solution, workflow } from '@dead-simple-ai-agent/framework/workflow'

import { getCurrentDate } from './tools/date.js'
import { getApiKey } from './tools/utils.js'
import { createWebSearchTools } from './tools/webSearch.js'

const apiKey = await getApiKey('Sereply.io API', 'SERPLY_API_KEY')
if (!apiKey) {
  console.error('API Key for Serply is required')
  process.exit(1)
}

const { googleSearch } = createWebSearchTools({
  apiKey,
})

const newsResearcher = agent({
  role: 'News Researcher',
  description: `
    You are skilled at searching the News over Web.
    Your job is to get the news from the last week.
  `,
  tools: {
    googleSearch,
    getCurrentDate,
  },
})

const newsReader = agent({
  role: 'News reader',
  description: `
    You're greatly skilled at reading and summarizing news headlines.
    Other team members rely on you to get the gist of the news.
    You always tries to be objective, not halucinating neither adding your own opinion.
  `,
})

const wrapupRedactor = agent({
  role: 'Redactor',
  description: `
    Your role is to wrap up the news and trends for the last week into a comprehensive report.
    Generalization is also one of your powerfull skills, however you're not a fortune teller.
    You're famous of precisely getting the overal picture, trends and summarizing it all.
  `,
})

const wrapUpTheNewsWorkflow = workflow({
  members: [newsResearcher, newsReader, wrapupRedactor],
  description: `
    Research the top news and trends for the last week - get title and headline description.
    Then summarize it all into a comprehensive report markdown output.

    Here are some ground rules to follow: 
      - Include one sentence summary for each article.
      - Include top takeaways - bulletpoints from each article.
  `,
  output: `
    Comprehensive markdown report with the top news and trends for the last week.
    Add one sentence of "State of the Affairs" summary.
  `,
  snapshot: logger,
})

const result = await teamwork(wrapUpTheNewsWorkflow)

console.log(solution(result))
