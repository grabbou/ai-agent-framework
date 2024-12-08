import { tool } from '@dead-simple-ai-agent/framework/tool'
import axios from 'axios'
import { z } from 'zod'

import { getApiKey } from '../utils.js'

export const braveWebSearch = tool({
  description: 'A tool to perform web searches using the Brave Search API.',
  parameters: z.object({
    query: z.string().describe('Mandatory search query to use for Brave search'),
  }),
  execute: async ({ query }) => {
    const apiKey = await getApiKey('Brave Search API', 'BRAVE_SEARCH_API_KEY')
    if (!apiKey) {
      throw new Error(
        'API Key for Brave Search is required. Please go to https://search.brave.com and create an account to obtain an API key.'
      )
    }

    const searchUrl = 'https://api.search.brave.com/res/v1/search'
    const limit = 10 // Default number of results

    const queryPayload = {
      q: query,
      count: limit,
      source: 'web',
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'brave-tools',
    }

    try {
      const response = await axios.get(searchUrl, {
        params: queryPayload,
        headers,
      })

      const results = response.data.web || []
      if (results.length > 0) {
        const content = results
          .map((result: any) => {
            try {
              return [
                `Title: ${result.title}`,
                `Link: ${result.url}`,
                `Description: ${result.snippet}`,
                '---',
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
