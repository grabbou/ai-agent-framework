import s from 'dedent'
import { z } from 'zod'

import { agent, AgentOptions } from '../agent.js'
import { assistant } from '../messages.js'
import { user } from '../messages.js'
import { handoff } from '../state.js'

const defaults: AgentOptions = {
  run: async (provider, state, context, workflow) => {
    const response = await provider.chat({
      messages: [
        {
          role: 'system',
          content: s`
            You are an agent selector that matches tasks to the most capable agent.
            Analyze the task requirements and each agent's capabilities to select the best match.
            
            Consider:
            1. Required tools and skills
            2. Agent's specialization
            3. Model capabilities
            4. Previous task context if available  
          `,
        },
        user(s`
          Here are the available agents:
          <agents>
            ${Object.entries(workflow.team).map(([name, agent]) =>
              agent.description ? `<agent name="${name}">${agent.description}</agent>` : ''
            )}
          </agents>`),
        assistant('What is the task?'),
        ...state.messages,
      ],
      temperature: 0.1,
      response_format: z.object({
        agent: z.enum(Object.keys(workflow.team) as [string, ...string[]]),
        reasoning: z.string(),
      }),
      name: 'agent_selection',
    })

    const message = response.parsed
    if (!message) {
      throw new Error('No content in response')
    }

    return handoff(state, message.agent)
  },
}

export const resourcePlanner = (options?: AgentOptions) =>
  agent({
    ...defaults,
    ...options,
  })
