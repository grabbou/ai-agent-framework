import s from 'dedent'
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

type GenerateEmbeddings = (content: string) => Promise<number[]>

/**
 * Use this function to create your own embeddings provider, with different model and API key.
 */
export const openAIEmbeddings = ({
  model = 'text-embedding-ada-002',
  baseUrl = 'https://api.openai.com/v1',
  apiKey = process.env.OPENAI_API_KEY,
}: {
  model?: string
  baseUrl?: string
  apiKey?: string
} = {}) => {
  return async (content: string): Promise<number[]> => {
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
        model,
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  }
}

/**
 * Creates a set of tools for interacting with a vector store.
 */
export const createVectorStoreTools = (
  vectorStore: VectorStore = createInMemoryVectorStore(),
  generateEmbeddings: GenerateEmbeddings = openAIEmbeddings()
) => {
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
      execute: async ({ id, content, metadata }) => {
        const embedding = await generateEmbeddings(content)
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
      execute: async ({ query, topK }) => {
        const queryEmbedding = await generateEmbeddings(query)
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
 * In-memory implementation of the VectorStore interface using functions.
 */
const createInMemoryVectorStore = () => {
  const store = new Map<string, EmbeddingResult>()

  const set = async (id: string, value: EmbeddingResult): Promise<void> => {
    store.set(id, value)
  }

  const entries = async (): Promise<[string, EmbeddingResult][]> => {
    return Array.from(store.entries())
  }

  return {
    set,
    entries,
  }
}
