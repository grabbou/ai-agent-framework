import 'dotenv/config'

import { visionTool } from '@fabrice-ai/tools/vision'
import { agent } from 'fabrice-ai/agent'
import { workflow } from 'fabrice-ai/workflow'
import path from 'path'

const techExpert = agent({
  description: `
    You are skilled at extracting and describing most detailed technical information about the product from the photo.
  `,
  tools: {
    visionTool,
  },
})

const marketingManager = agent({
  description: `
    You are skilled at writing catchy product descriptions making customers to instantly fall in love with the product.
    You always answer why they should buy the product, how it will make their life better, 
    and what emotions it will evoke.
  `,
})

export const productDescriptionWorkflow = workflow({
  team: { techExpert, marketingManager },
  description: `
    Based on the picture of the product, make the product description to list it on the website.
  `,
  knowledge: `
    Focus on all technical features of the product, including color, size, material, brand if possible, etc.
    Picture is at "${path.resolve(import.meta.dirname, '../assets/example-sneakers.jpg')}". 
  `,
  output: `
    Catchy product description covering all the product features.
  `,
})
