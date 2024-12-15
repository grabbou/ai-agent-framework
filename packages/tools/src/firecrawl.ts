import axios from 'axios'
import s from 'dedent'
import { tool } from 'fabrice-ai/tool'
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

const defaults = {
  formats: ['markdown'],
  url: 'https://api.firecrawl.dev/v1/scrape',
}

export const createFireCrawlTool = (options: FireCrawlOptions) => {
  const config = {
    ...defaults,
    ...options,
  } satisfies Required<FireCrawlOptions>

  const request = {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  }

  return {
    firecrawl: tool({
      description:
        'Scrape a website and return its content in specified formats using the FireCrawl API',
      parameters: z.object({
        url: z.string().describe('URL of the website to scrape'),
        formats: z
          .array(z.string())
          .describe('Output formats to include (options: markdown, html). Default: markdown'),
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
