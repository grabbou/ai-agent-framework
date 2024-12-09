import { openai } from '@dead-simple-ai-agent/framework/models'
import { tool } from '@dead-simple-ai-agent/framework/tool'
import dedent from 'dedent'
import { z } from 'zod'

// Type Definitions
interface VectorStore {
  set: (
    id: string,
    value: { content: string; metadata: string; embedding: number[] }
  ) => void | Promise<void>
  entries: () =>
    | IterableIterator<[string, { content: string; metadata: string; embedding: number[] }]>
    | Promise<
        IterableIterator<[string, { content: string; metadata: string; embedding: number[] }]>
      >
}

interface EmbeddingResult {
  content: string
  metadata: Record<string, string>
  embedding: number[]
}

// Default in-memory vector database
let vectorStore: VectorStore = new Map()

// Utility to switch vector store implementation
export const setVectorStore = (store: VectorStore) => {
  vectorStore = store
}

// Helper function to compute embeddings
const computeEmbedding = async (text: string): Promise<number[]> => {
  const response = await openai().client.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  })

  return response.data[0].embedding
}

export const ragSave = tool({
  description: 'Save a document and its metadata to the vector store.',
  parameters: z.object({
    id: z.string().describe('Unique identifier for the document'),
    content: z.string().describe('Text content of the document'),
    metadata: z.string().describe('Additional metadata for the document'),
  }),
  execute: async ({ id, content, metadata }: { id: string; content: string; metadata: string }) => {
    const embedding = await computeEmbedding(content)
    vectorStore.set(id, { content, metadata, embedding })
    return 'Saved as ' + id
  },
})

export const ragSearch = tool({
  description: 'Search for documents in the vector store using a query.',
  parameters: z.object({
    query: z.string().describe('Search query'),
    topK: z.number().describe('Number of top results to return'),
  }),
  execute: async ({ query, topK }: { query: string; topK: number }) => {
    const queryEmbedding = await computeEmbedding(query)

    // Perform similarity search
    const results = Array.from(vectorStore.entries())
      .map(([id, { content, metadata, embedding }]: [string, EmbeddingResult]) => {
        const similarity = cosineSimilarity(queryEmbedding, embedding)
        return { id, content, metadata, similarity }
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)

    return results
      .map(
        ({ id, content, metadata }) =>
          dedent`ID: ${id}
             Content: ${content}
             Metadata: ${JSON.stringify(metadata)}`
      )
      .join('\n')
  },
})

// Cosine similarity function
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a ** 2, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b ** 2, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
