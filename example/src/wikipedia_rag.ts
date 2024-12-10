import { ragSave, ragSearch } from '@fabrice-ai/tools/vector/index'
import { agent } from 'fabrice-ai/agent'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
import { solution, workflow } from 'fabrice-ai/workflow'

import { lookupWikipedia } from './tools/wikipedia.js'

const wikipediaIndexer = agent({
  role: 'Wikipedia Indexer',
  description: `
    You are skilled at reading and understanding the context of Wikipedia articles.
    You create an index of embeddings for each sentence to make it easy for other team members to search.
  `,
  tools: {
    lookupWikipedia,
    ragSave,
  },
})

const reportCompiler = agent({
  role: 'Report Compiler',
  description: `
    You are skilled at compiling information from various sources into a coherent report.
    You have access to RAG database with indexed sentences of Wikipedia articles.
    You are making use of it to find relevant information.
  `,
  tools: {
    ragSearch,
  },
})

const wikipediaResearch = workflow({
  members: [wikipediaIndexer, reportCompiler],
  description: `
    Find information about John III Sobieski.
    Index the data into vector database.
    List exact full paragraphs related to:
     - Battle of Vienna.
     - John III Youth,
     - John III later years and death.
  `,
  output: `
    Report with:
     - bullet points - list of 2 sentences per each topic from vector db.
  `,
  snapshot: logger,
})

const result = await teamwork(wikipediaResearch)

console.log(solution(result))
