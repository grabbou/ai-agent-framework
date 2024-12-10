@fabrice-ai/tools
====

## 📅 Get Current Date

> `packages/tools/src/date.ts`

Retrieves the current date in ISO format.

### Example
```typescript
import { getCurrentDate } from '@fabrice-ai/tools/date'

const exampleAgent = agent({
  role: '...',
  description: '...',
  tools: {
    getCurrentDate,
  },
})
```

## 🔍 Google Search with Serply.io

> `packages/tools/src/webSearch.ts`

Performs a Google search with a search query using the Serply API.

### Example
```typescript
import { createWebSearchTools } from '@fabrice-ai/tools/webSearch'

const apiKey = 'your-serply-api-key'
const { googleSearch } = createWebSearchTools({ apiKey })

const exampleAgent = agent({
  role: '...',
  description: '...',
  tools: {
    googleSearch,
  },
})
```

## 🖼️ Google Image Search

> `packages/tools/src/webSearch.ts`

Performs a Google Image search with a search query using the Serply API.

### Example
```typescript
import { createWebSearchTools } from '@fabrice-ai/tools/webSearch'

const apiKey = 'your-serply-api-key'
const { googleImageSearch } = createWebSearchTools({ apiKey })

const exampleAgent = agent({
  role: '...',
  description: '...',
  tools: {
    googleImageSearch,
  },
})
```

## 🌐 Web Scraper

> `packages/tools/src/firecrawl.ts`

Scrapes a website using Firecrawl.dev to extract metadata and content.

### Example
```typescript
import { createFireCrawlTool } from '@fabrice-ai/tools/firecrawl'

const exampleAgent = agent({
  role: '...',
  description: '...',
  tools: {
    createFireCrawlTool({
        apiKey: 'Firecrawl API key ...'
    }),
  },
})
```

## 🫙 Vector Store

> `packages/tools/src/vector.ts`

Save documents with embeddings, perform vector search.

### Example
```typescript
import { createVectorStoreTools } from '@fabrice-ai/tools/vector'

const { saveDocumentInVectorStore, searchInVectorStore } = createVectorStoreTools()

const exampleAgent = agent({
  role: '...',
  description: '...',
  tools: {
    saveDocumentInVectorStore,
    searchInVectorStore
  },
})
```

### Example with custom VectorStore
```typescript
import { createVectorStoreTools } from '@fabrice-ai/tools/vector'

/**
 * createVectorStore accepts a `vectorStore` adapter. 
 * This is a way to switch the default - in-memory store to Pinecone or others of your choice.
 */
const createPineconeVectorStore = () => {
  const store = new Map<string, EmbeddingResult>()

  const set = async (id: string, value: EmbeddingResult): Promise<void> => {
    // @tbd: implement storing document in Pinecone
  }

  const entries = async (): Promise<[string, EmbeddingResult][]> => {
    // @tbd: implement searching documents in Pinecone
  }

  return {
    set,
    entries,
  }
}

const { saveDocumentInVectorStore, searchInVectorStore } = createVectorStoreTools(createPineconeVectorStore())

const exampleAgent = agent({
  role: '...',
  description: '...',
  tools: {
    saveDocumentInVectorStore,
    searchInVectorStore
  },
})
```

## 🖼️ Vision tool

> `packages/tools/src/vision.ts`

Uses LLM as a OCR / Vision tool. Extract text or features from a picture.

### Example
```typescript
import { visionTool } from '@fabrice-ai/tools/vision'

const exampleAgent = agent({
  role: '...',
  description: '...',
  tools: {
    visionTool    
  },
})
```

## 🗄️ FileSystem tools

> `packages/tools/src/filesystem.ts`

File system tools for reading, writing and listing files. The tools are sandboxed into `workingDir` for safety.

### Example
```typescript
import { createFileSystemTools } from '@fabrice-ai/tools/filesystem'

const workingDir = path.resolve(__dirname, '../assets/')

const { saveFile, readFile, listFilesFromDirectory } = createFileSystemTools({
  workingDir,
})

const exampleAgent = agent({
  role: '...',
  description: '...',
  tools: {
    visionTool    
  },
})
```
