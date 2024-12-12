import { createVectorStoreTools } from '@fabrice-ai/tools/vector'
import { agent } from 'fabrice-ai/agent'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'

import { lookupWikipedia } from './tools/wikipedia.js'

const { saveDocumentInVectorStore, searchInVectorStore } = createVectorStoreTools()

const wikipediaIndexer = agent({
  description: `
    You are skilled at reading and understanding the context of Wikipedia articles.
    You split Wikipedia articles by each sentence to make it easy for other team members to search exact sentences in vector store.
  `,
  tools: {
    lookupWikipedia,
    saveDocumentInVectorStore,
  },
})

const reportCompiler = agent({
  description: `
    You are skilled at compiling information from various sources into a coherent report.
    You have access to Vector database with indexed sentences of Wikipedia articles.
    You are making use of it to find relevant information.
  `,
  tools: {
    searchInVectorStore,
  },
})

const wikipediaResearch = workflow({
  team: { wikipediaIndexer, reportCompiler },
  description: `
    Find information about John III Sobieski.
    Index the data into vector database. One sentence is one document saved in Vector store.
    List exact some example sentences related to:
     - Battle of Vienna.
     - John III Youth,
     - John III later years and death.
  `,
  output: `
    Report with:
     - bullet points - list of 2 sentences per each topic from vector store.
  `,
  snapshot: logger,
})

const result = await teamwork(wikipediaResearch)

console.log(solution(result))
