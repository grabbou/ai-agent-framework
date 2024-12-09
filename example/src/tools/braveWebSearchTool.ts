import { tool } from '@dead-simple-ai-agent/framework/tool'
import { RequiredOptionals } from '@dead-simple-ai-agent/framework/types'
import axios from 'axios'
import dedent from 'dedent'
import { z } from 'zod'

interface BraveSearchOptions {
  /**
   * Serply.io API key
   */
  apiKey: string
  limit?: number
  searchUrl?: string
  source?: string
}

const defaults: RequiredOptionals<BraveSearchOptions> = {
  searchUrl: 'https://api.search.brave.com/res/v1/search',
  limit: 5,
  source: 'web',
}

export const braveWebSearch = (options: BraveSearchOptions) =>
  tool({
    description: 'A tool to perform web searches using the Brave Search API.',
    parameters: z.object({
      query: z.string().describe('Mandatory search query to use for Brave search'),
    }),
    execute: async ({ query }) => {
      const config = {
        ...defaults,
        ...options,
      }

      const queryPayload = {
        q: query,
        count: config.limit,
        source: 'web',
      }

      const headers = {
        Authorization: `Bearer ${config.apiKey}`,
        'User-Agent': 'brave-tools',
      }

      try {
        const response = await axios.get(config.searchUrl, {
          params: queryPayload,
          headers,
        })

        const results = response.data.web || []
        if (results.length > 0) {
          const content = results
            .map((result: any) => {
              try {
                return [
                  dedent`Title: ${result.title}
                         Link: ${result.url}
                         Description: ${result.snippet}
                         ---`,
                ].join('\n')
              } catch {
                return null
              }
            })
            .filter((item: string | null) => item)
            .join('\n')

          return `Search results:\n${content}`
        } else {
          return 'No results found.'
        }
      } catch (error) {
        return `Error occurred: ${error.response?.data?.message || error.message}`
      }
    },
  })
