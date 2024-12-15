import { visionTool } from '@fabrice-ai/tools/vision'
import { agent } from 'fabrice-ai/agent'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
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

const productDescriptionWorkflow = workflow({
  team: { techExpert, marketingManager },
  description: `
    Based on the picture '${path.resolve(import.meta.dirname, '../assets/example-sneakers.jpg')}'
    make the product description to list it on the website.
    Make sure you are using visionTool just once as it's very time consuming operation.
    Then use the extracted information for other agents.
  `,
  knowledge: `
    Focus on all technical features of the product, including color, size, material, brand if possible, etc.
  `,
  output: `
    Catchy product description covering all the product features.
  `,
  snapshot: logger,
})
const result = await teamwork(productDescriptionWorkflow)

console.log(solution(result))
