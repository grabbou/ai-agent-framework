import fs from 'node:fs/promises'
import path from 'node:path'

import s from 'dedent'
import { Provider } from 'fabrice-ai/models'
import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

const encodeImage = async (imagePath: string): Promise<string> => {
  const imageBuffer = await fs.readFile(imagePath)
  return `data:image/${path.extname(imagePath).toLowerCase().replace('.', '')};base64,${imageBuffer.toString('base64')}`
}

async function callOpenAI(
  provider: Provider,
  prompt: string,
  image_url: string,
  detail: 'low' | 'high'
) {
  const response = await provider.chat({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: image_url, detail } },
          {
            type: 'text',
            text: `${prompt}. Use your built-in OCR capabilities.`,
          },
        ],
      },
    ],
    response_format: {
      vision_request_success: z.object({
        text: z.string(),
      }),
      vision_request_error: z.object({
        message: z.string(),
      }),
    },
  })
  if (response.kind === 'vision_request_error') {
    throw new Error(response.value.message)
  }
  return response.value.text
}

export const visionTool = tool({
  description:
    'Analyzes the pictures using LLM Multimodal model with image to text (OCR) capabilities.',
  parameters: z.object({
    imagePathUrl: z.string().describe('Absolute path to image on disk or URL'),
    prompt: z.string().describe(s`
      This is a prompt for LLM Multimodal model - a detailed instruction of what to analyze and extract
      from the image, such as: text content, layout, font styles, and any specific data fields.
    `),
    detail: z
      .enum(['low', 'high'])
      .describe(
        'Fidelity of the analysis. For detailed analysis, use "high". For general questions, use "low".'
      )
      .default('high'),
  }),
  execute: async ({ imagePathUrl, detail, prompt }, { provider }) => {
    const imageUrl = imagePathUrl.startsWith('http')
      ? imagePathUrl
      : await encodeImage(imagePathUrl)
    return callOpenAI(provider, prompt, imageUrl, detail)
  },
})
