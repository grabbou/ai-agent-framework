/**
 * Example borrowed from CrewAI.
 */
import { openai } from '@dead-simple-ai-agent/framework/models/openai'
import { tool } from '@dead-simple-ai-agent/framework/tool'
import * as fs from 'fs'
import { z } from 'zod'

const encodeImage = (imagePath: string): string => {
  const imageBuffer = fs.readFileSync(imagePath)
  return imageBuffer.toString('base64')
}
const visionProvider = openai()

const runLocalImages = async (imagePathUrl: string): Promise<string> => {
  const base64Image = encodeImage(imagePathUrl)
  const response = await visionProvider.completions({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: "What's in this image?" },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        ],
      },
    ],
    max_tokens: 300,
  })
  return response.choices[0].message.content as string
}

const runWebHostedImages = async (imagePathUrl: string): Promise<string> => {
  const response = await visionProvider.completions({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: "What's in this image?" },
          { type: 'image_url', image_url: { url: imagePathUrl } },
        ],
      },
    ],
    max_tokens: 300,
  })

  return response.choices[0].message.content as string
}

export const visionTool = tool({
  description: 'Tool for analyzing and OCR the pitures',
  parameters: z.object({
    imagePathUrl: z.string().describe('The image path or URL'),
  }),
  execute: ({ imagePathUrl }) => {
    if (!imagePathUrl) {
      throw new Error('Image Path or URL is required.')
    }

    if (imagePathUrl.startsWith('http')) {
      return runWebHostedImages(imagePathUrl)
    } else {
      return runLocalImages(imagePathUrl)
    }
  },
})
