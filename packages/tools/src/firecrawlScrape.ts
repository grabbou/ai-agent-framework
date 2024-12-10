import { tool } from '@dead-simple-ai-agent/framework/tool'
import { RequiredOptionals } from '@dead-simple-ai-agent/framework/types'
import axios from 'axios'
import s from 'dedent'
import { z } from 'zod'

/**
 * Configuration options for FireCrawl API
 * @see https://docs.firecrawl.dev
 */
interface FireCrawlOptions {
  /**
   * API Key for authentication with FireCrawl API
   * Required for all API calls. Get one at https://firecrawl.dev
   */
  apiKey: string

  /**
   * Default output formats for the scrape
   * Specifies the formats to include in the response (e.g., 'markdown', 'html')
   * @default ['markdown', 'html']
   */
  formats?: string[]

  /** Firecrawl API endpoint
   * @default 'https://api.firecrawl.dev/v1/scrape'
   */
  url?: string
}

const defaults: RequiredOptionals<FireCrawlOptions> = {
  formats: ['markdown'],
  url: 'https://api.firecrawl.dev/v1/scrape',
}

const FireCrawlResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    markdown: z.string().optional(),
    html: z.string().optional(),
    metadata: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      language: z.string().optional(),
      keywords: z.string().optional(),
      robots: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogUrl: z.string().optional(),
      ogImage: z.string().optional(),
      sourceURL: z.string().optional(),
      statusCode: z.number().optional(),
    }),
  }),
})

export const createFireCrawlTool = (options: FireCrawlOptions) => {
  const config = {
    ...defaults,
    ...options,
  }

  const request = {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  }

  return {
    firecrawlScrape: tool({
      description:
        'Scrape a website and return its content in specified formats using the FireCrawl API',
      parameters: z.object({
        url: z.string().describe('URL of the website to scrape'),
        formats: z
          .array(z.string())
          .optional()
          .describe('Output formats to include (options: markdown, html)'),
      }),
      execute: async ({ url, formats }) => {
        const body = {
          url,
          formats: formats || config.formats,
        }

        try {
          const response = await axios.post(config.url, body, request)
          const parsedResponse = FireCrawlResponseSchema.parse(response.data)

          if (!parsedResponse.success) {
            throw new Error('Failed to scrape the website.')
          }

          const { markdown, html, metadata } = parsedResponse.data

          return s`
            Scraped content for URL "${url}":
            ${markdown ? `\nMarkdown:\n${markdown}` : ''}
            ${html ? `\nHTML:\n${html}` : ''}
            \nMetadata:\n${JSON.stringify(metadata, null, 2)}
          `
        } catch (error) {
          return `Error scraping website: ${error}`
        }
      },
    }),
  }
}
