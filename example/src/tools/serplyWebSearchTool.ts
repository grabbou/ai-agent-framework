import { tool } from '@dead-simple-ai-agent/framework/tool'
import { RequiredOptionals } from '@dead-simple-ai-agent/framework/types'
import axios from 'axios'
import { z } from 'zod'

interface SerplyOptions {
  /**
   * Serply.io API key
   */
  apiKey: string
  limit?: number
  hl?: string
  proxyLocation?: string
  searchUrl?: string
}

const defaults: RequiredOptionals<SerplyOptions> = {
  searchUrl: 'https://api.serply.io/v1/search/q',
  limit: 5,
  hl: 'en',
  proxyLocation: 'us',
}

export const serplyWebSearch = (options: SerplyOptions) =>
  tool({
    description: 'A tool to perform Google search with a search query using Serply API.',
    parameters: z.object({
      query: z.string().describe('Mandatory search query to use for Google search'),
    }),
    execute: async ({ query }) => {
      const config = {
        ...defaults,
        ...options,
      }

      if (!options.apiKey) {
        throw new Error(
          'API Key for Serply.io is required. Please go to https://serply.io and create a free account to get the API key.'
        )
      }

      const queryPayload = {
        num: config.limit,
        gl: config.proxyLocation.toUpperCase(),
        hl: config.hl.toLowerCase(),
      }
      const headers = {
        'X-Api-Key': config.apiKey,
        'X-User-Agent': '',
        'Content-Type': 'application/json',
        'X-Proxy-Location': config.proxyLocation,
      }

      try {
        const response = await axios.get(config.searchUrl + encodeURIComponent(query), {
          params: queryPayload,
          headers,
        })

        const results = response.data.results
        if (results) {
          const content = results
            .map((result: any) => {
              try {
                return [
                  `Title: ${result.title}`,
                  `Link: ${result.link}`,
                  `Description: ${result.description.trim()}`,
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
        console.error(error)
        process.exit(-1)
        return `Error occurred: ${error.message}`
      }
    },
  })
