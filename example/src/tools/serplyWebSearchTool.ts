import { tool } from '@dead-simple-ai-agent/framework/tool'
import axios from 'axios'
import { z } from 'zod'

import { getApiKey } from '../utils.js'

export const serplyWebSearch = tool({
  description: 'A tool to perform Google search with a search query using Serply API.',
  parameters: z.object({
    query: z.string().describe('Mandatory search query to use for Google search'),
  }),
  execute: async ({ query }) => {
    const apiKey = await getApiKey('Sereply.io API', 'SERPLY_API_KEY')
    if (!apiKey) {
      throw new Error(
        'API Key for Serply.io is required. Please go to https://serply.io and create a free account to get the API key.'
      )
    }

    const searchUrl = 'https://api.serply.io/v1/search/q='
    const limit = 10 // Default number of results
    const hl = 'us' // Host language
    //    const deviceType = 'desktop' // Device type
    const proxyLocation = 'US' // Proxy location

    const queryPayload = {
      num: limit,
      gl: proxyLocation.toUpperCase(),
      hl: hl.toLowerCase(),
    }
    const headers = {
      'X-Api-Key': apiKey,
      'X-User-Agent': '',
      'Content-Type': 'application/json',
      'X-Proxy-Location': proxyLocation,
    }

    try {
      const response = await axios.get(searchUrl + encodeURIComponent(query), {
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
