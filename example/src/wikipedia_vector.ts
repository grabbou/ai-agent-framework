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
    You can save Wikipedia articles in Vector store for later use.
    When saving Wikipedia articles, you must save first 10 sentences in Vector store.
  `,
  tools: {
    lookupWikipedia,
    saveDocumentInVectorStore,
  },
})

const reportCompiler = agent({
  description: `
    You are skilled at compiling information from various sources into a coherent report.
    You can search for specific sentences in Vector database.
  `,
  tools: {
    searchInVectorStore,
  },
})

const wikipediaResearch = workflow({
  team: { wikipediaIndexer, reportCompiler },
  description: `
    Find information about John III Sobieski on Wikipedia and save it in Vector store.
    Lookup sentences related to the following topics:
     - "Battle of Vienna"
     - "John III later years and death"
  `,
  knowledge: `
    Each document in vector store is a sentence.
  `,
  output: `
    List of 2 sentences from Vector store per each topic, in bullet points.
  `,
  snapshot: logger,
})

const result = await teamwork(wikipediaResearch)

console.log(solution(result))
