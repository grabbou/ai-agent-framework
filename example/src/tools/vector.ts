import s from 'dedent'
import { Provider } from 'fabrice-ai/models'
import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

/**
 * Interface for storing and retrieving vector embeddings with associated content and metadata.
 * Implementations can use different storage backends (e.g. in-memory, database, etc.)
 */
export interface VectorStore {
  set: (id: string, value: EmbeddingResult) => Promise<void>
  entries: () => Promise<[string, EmbeddingResult][]>
}

/**
 * Represents a document with its embedding vector and associated metadata
 */
type EmbeddingResult = {
  content: string
  embedding: number[]
  metadata: any
}

/**
 * Creates a set of tools for interacting with a vector store.
 */
export const createVectorStoreTools = (vectorStore: VectorStore) => {
  return {
    /**
     * Tool for saving a document and its metadata to the vector store.
     * Computes embeddings for the content before storing.
     */
    saveDocumentInVectorStore: tool({
      description: 'Save a document and its metadata to the vector store.',
      parameters: z.object({
        id: z.string().describe('Unique identifier for the document'),
        content: z.string().describe('Content of the document'),
        metadata: z.string().describe('Additional metadata for the document'),
      }),
      execute: async ({ id, content, metadata }, { provider }) => {
        const embedding = await computeEmbedding(provider, content)
        vectorStore.set(id, { content, metadata, embedding })
        return `Document saved with id: ${id}`
      },
    }),

    /**
     * Tool for searching documents in the vector store using semantic similarity.
     * Returns the top K most similar documents to the query.
     */
    searchInVectorStore: tool({
      description: 'Search for documents in the vector store using a query.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        topK: z.number().describe('Number of top results to return'),
      }),
      execute: async ({ query, topK }, { provider }) => {
        const queryEmbedding = await computeEmbedding(provider, query)
        const entries = await vectorStore.entries()

        const results = entries
          .map(([id, entry]: [string, EmbeddingResult]) => {
            const similarity = cosineSimilarity(queryEmbedding, entry.embedding)
            return { ...entry, id, similarity }
          })
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK)

        return results
          .map(
            (entry) => s`
              ID: ${entry.id}
              Content: ${entry.content}
              Metadata: ${JSON.stringify(entry.metadata)}
            `
          )
          .join('\n')
      },
    }),
  }
}

/**
 * Calculates the cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 means vectors are identical.
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a ** 2, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b ** 2, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Computes an embedding vector for the given text using the OpenAI API.
 */
const computeEmbedding = async (provider: Provider, text: string): Promise<number[]> => {
  const response = await provider.client.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  })

  return response.data[0].embedding
}
