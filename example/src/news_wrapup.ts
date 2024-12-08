/**
 * Example borrowed from CrewAI.
 */

import { agent } from '@dead-simple-ai-agent/framework/agent'
import { teamwork } from '@dead-simple-ai-agent/framework/teamwork'
import { logger } from '@dead-simple-ai-agent/framework/telemetry/console'
import { workflow } from '@dead-simple-ai-agent/framework/workflow'

import { getCurrentDate } from './tools/currentDateTool.js'
import { serplyWebSearch } from './tools/serplyWebSearchTool.js'

const newsResearcher = agent({
  role: 'News Researcher',
  description: `
    You are skilled at searching the Web.
  `,
  tools: {
    serplyWebSearch,
    getCurrentDate,
  },
})

const newsReader = agent({
  role: 'News reader',
  description: `
    You're greatly skilled at reading and summarizing news headlines
  `,
})

const wrapupRedactor = agent({
  role: 'Redactor',
  description: `
    You're doing great job in redacting the news and trends into a comprehensive report.
  `,
})

const wrapUpTheNewsWorkflow = workflow({
  members: [newsResearcher, newsReader, wrapupRedactor],
  description: `
    Research the top news and trends for the last week - get title and headline description.
    Then summarize it all into a comprehensive report markdown report.

    Focus:
      - Search the web for the latest news and trends for the last week.
      - Include one sentence summary for each article.
      - Include top takeaways bulletpoints from each article.
      - Create one sentence "State of the Affairs" summary.
      - Create a comprehensive report markdown report.
      - Don not get deeper into the links on the news website; first page is enough
  `,
  output: `
    Comprehensive markdown report with the top news and trends for the last week.
  `,
  telemetry: logger,
})

const result = await teamwork(wrapUpTheNewsWorkflow)

console.log(result)
