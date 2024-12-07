/**
 * Example borrowed from CrewAI.
 */
import { tool } from '@dead-simple-ai-agent/framework/tool'
import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run'
import { z } from 'zod'

const wikipedia = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 4000,
})

export const lookupWikipedia = tool({
  description: 'Tool for querying Wikipedia',
  parameters: z.object({
    query: z.string().describe('The query to search Wikipedia with'),
  }),
  execute: ({ query }) => wikipedia.invoke(query),
})
