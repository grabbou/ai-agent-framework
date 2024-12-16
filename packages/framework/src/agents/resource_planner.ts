import s from 'dedent'
import { z } from 'zod'

import { agent, AgentOptions } from '../agent.js'
import { assistant } from '../messages.js'
import { user } from '../messages.js'
import { handoff } from '../state.js'
import { isCoreTeam } from '../workflow.js'

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
            ${Object.entries(workflow.team)
              /**
               * Do not include core team agents in the list of available agents.
               * We only assign to user-defined agents.
               */
              .filter(([name]) => !isCoreTeam(name))
              .map(([name, agent]) => `<agent name="${name}">${agent.description}</agent>`)
              .join('')}
          </agents>`),
        assistant('What is the task?'),
        ...state.messages,
      ],
      temperature: 0.1,
      response_format: {
        select_agent: z.object({
          agent: z.enum(Object.keys(workflow.team) as [string, ...string[]]),
          reasoning: z.string(),
        }),
      },
    })
    console.log(response.value)
    return handoff(state, response.value.agent)
  },
}

export const resourcePlanner = (options?: AgentOptions) =>
  agent({
    ...defaults,
    ...options,
  })
