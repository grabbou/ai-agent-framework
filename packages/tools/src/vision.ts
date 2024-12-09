import fs from 'node:fs/promises'

import { Provider } from '@dead-simple-ai-agent/framework/models'
import { tool } from '@dead-simple-ai-agent/framework/tool'
import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const encodeImage = async (imagePath: string): Promise<string> => {
  const imageBuffer = await fs.readFile(imagePath)
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
}

async function callOpenAI(
  provider: Provider,
  prompt: string,
  image_url: string,
  detail: 'low' | 'high'
) {
  const response = await provider.completions({
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
    response_format: zodResponseFormat(
      z.object({
        response: z.discriminatedUnion('type', [
          z.object({
            type: z.literal('success'),
            text: z.string(),
          }),
          z.object({
            type: z.literal('failure'),
            error: z.string(),
          }),
        ]),
      }),
      'vision_request'
    ),
  })
  const message = response.choices[0].message.parsed
  if (!message) {
    throw new Error('No message returned from OpenAI')
  }
  if (message.response.type !== 'success') {
    throw new Error(message.response.error)
  }
  return message.response.text
}

export const visionTool = tool({
  description:
    'Analyzes the pictures using LLM Multimodal model with image to text (OCR) capabilities.',
  parameters: z.object({
    imagePathUrl: z.string().describe('Absolute path to image on disk or URL'),
    prompt: z.string().describe(s`
      This is a prompt for LLM Multimodal model - a detailed instruction of what to analyze and extract
      from the image, such as: text content, layout, font styles, and any specific data fields.
      '
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
