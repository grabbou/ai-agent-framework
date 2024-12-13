import 'dotenv/config'

import { getCurrentDate } from '@fabrice-ai/tools/date'
import { getApiKey } from '@fabrice-ai/tools/utils'
import { createWebSearchTools } from '@fabrice-ai/tools/webSearch'
import { agent } from 'fabrice-ai/agent'
import { openai } from 'fabrice-ai/models'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'

const apiKey = await getApiKey('Serply.io API', 'SERPLY_API_KEY')
const ollama = openai({
  options: {
    baseURL: 'http://localhost:11434/v1',
  },
  model: 'llama3.1',
})

const { googleSearch } = createWebSearchTools({
  apiKey,
})

const newsResearcher = agent({
  provider: ollama,
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
  provider: ollama,
  description: `
    You're greatly skilled at reading and summarizing news headlines.
    Other team members rely on you to get the gist of the news.
    You always tries to be objective, not halucinating neither adding your own opinion.
  `,
})

const wrapupRedactor = agent({
  provider: ollama,
  description: `
    Your role is to wrap up the news and trends for the last week into a comprehensive report.
    Generalization is also one of your powerfull skills, however you're not a fortune teller.
    You're famous of precisely getting the overal picture, trends and summarizing it all.
  `,
})

const wrapUpTheNewsWorkflow = workflow({
  team: { newsResearcher, newsReader, wrapupRedactor },
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
