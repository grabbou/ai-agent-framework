import { setVectorStore } from './index.js'

// Example of switching to Pinecone (or another vector store)
export const usePineconeVectorStore = (pineconeClient: any, indexName: string) => {
  setVectorStore({
    set: async (
      id: string,
      { content, metadata, embedding }: { content: string; metadata: string; embedding: number[] }
    ) => {
      await pineconeClient.index(indexName).upsert({
        id,
        values: embedding,
        metadata: { content, metadata },
      })
    },
    entries: async () => {
      const index = pineconeClient.index(indexName)
      const results = await index.query({
        topK: 10000,
        includeMetadata: true,
      })
      return results.matches
        .map(({ id, metadata, values }: any) => [
          id,
          { content: metadata.content, metadata, embedding: values },
        ])
        [Symbol.iterator]()
    },
  })
}
