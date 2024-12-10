import axios from 'axios'
import s from 'dedent'
import { tool } from 'fabrice-ai/tool'
import { RequiredOptionals } from 'fabrice-ai/types'
import { z } from 'zod'

/**
 * Configuration options for Serply.io web search API
 * @see https://serply.io/docs/api/search
 */
interface SerplyOptions {
  /**
   * API Key for authentication with Serply.io
   * Required for all API calls. Get one at https://serply.io
   */
  apiKey: string

  /**
   * Maximum number of results to return per search
   * @default 5
   */
  limit?: number

  /**
   * Interface language code (e.g. 'en', 'es', 'fr')
   * Controls the language of the search interface and results
   * @default 'en'
   */
  hl?: string

  /**
   * Geographic location to proxy the search from
   * Affects search results based on location
   * @default 'US'
   */
  proxyLocation?: string
}

const defaults: RequiredOptionals<SerplyOptions> = {
  limit: 5,
  hl: 'en',
  proxyLocation: 'US',
}

const GoogleSearchResponseSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      link: z.string(),
      description: z.string(),
    })
  ),
})

const GoogleImageSearchResponseSchema = z.object({
  results: z.array(
    z.object({
      image: z.object({
        src: z.string(),
        alt: z.string(),
      }),
      link: z.object({
        href: z.string(),
        title: z.string(),
        domain: z.string(),
      }),
    })
  ),
})

export const createWebSearchTools = (options: SerplyOptions) => {
  const config = {
    ...defaults,
    ...options,
  }

  const request = {
    headers: {
      'X-Api-Key': config.apiKey,
      'X-User-Agent': 'desktop',
      'Content-Type': 'application/json',
      'X-Proxy-Location': config.proxyLocation,
    },
    params: {
      num: config.limit,
      gl: config.proxyLocation,
      hl: config.hl,
    },
  }

  return {
    googleSearch: tool({
      description: 'Perform Google search with a search query using Serply API',
      parameters: z.object({
        query: z.string().describe('Search query to use for Google search'),
      }),
      execute: async ({ query }) => {
        const response = await axios.get(
          `https://api.serply.io/v1/search/q=${encodeURIComponent(query)}`,
          request
        )

        const parsedResponse = GoogleSearchResponseSchema.parse(response.data)

        const results = parsedResponse.results
          .map(
            (result) => s`
              Title: ${result.title}
              Link: ${result.link}
              Description: ${result.description}
            `
          )
          .join('\n')

        return s`
          Search results for query "${query}":
          ${results}
        `
      },
    }),
    googleImageSearch: tool({
      description: 'Perform Google Image search with a search query using Serply API',
      parameters: z.object({
        query: z.string().describe('Search query to use for Google Image search'),
      }),
      execute: async ({ query }) => {
        const response = await axios.get(
          `https://api.serply.io/v1/search/q=${encodeURIComponent(query)}`,
          request
        )

        const parsedResponse = GoogleImageSearchResponseSchema.parse(response.data)

        const results = parsedResponse.results
          .map(
            (result) => s`
              Title: ${result.link.title}
              Link: ${result.link.href}
              Image: ${result.image.src}
            `
          )
          .join('\n')

        return s`
          Image search results for query "${query}":
          ${results}
        `
      },
    }),
  }
}
