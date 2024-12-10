import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

export const getCurrentDate = tool({
  description: 'Tool for retrieving the current date',
  parameters: z.object({}),
  execute: () => {
    const currentDate = new Date().toISOString()
    return Promise.resolve(currentDate)
  },
})
