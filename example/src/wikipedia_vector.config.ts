import 'dotenv/config'

import { createVectorStoreTools } from '@fabrice-ai/tools/vector'
import { agent } from 'fabrice-ai/agent'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'

import { lookupWikipedia } from './tools/wikipedia.js'

const { saveDocumentInVectorStore, searchInVectorStore } = createVectorStoreTools()

const wikipediaIndexer = agent({
  description: `
    You are skilled at reading and understanding the context of Wikipedia articles.
    You can save information in Vector store for later use.
    When saving articles in Vector store, you store every sentence as a separate document and 
    you only save first 10 sentences.
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

export const wikipediaResearch = workflow({
  team: { wikipediaIndexer, reportCompiler },
  description: `
    Find information about John III Sobieski on Wikipedia and save it in Vector store.
    Lookup sentences related to the following topics:
     - "Dates of reign as King of Poland"
     - "John III education"
  `,
  knowledge: `
    Each document in Vector store is a sentence from the Wikipedia article.
  `,
  output: `
    List of sentences looked up for each topic. Each sentence should be in separate bullet point.
  `,
  snapshot: logger,
})
