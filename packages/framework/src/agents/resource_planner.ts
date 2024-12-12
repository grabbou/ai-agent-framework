import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import { Agent } from '../agent.js'
import { workflowState } from '../state.js'

export const resourcePlanner: Agent = async (state, context, workflow) => {
  const response = await workflow.provider.completions({
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
      {
        role: 'user',
        content: s`
          Here are the available agents:
          <agents>
            ${Object.entries(workflow.team).map(([name, agent]) => `<agent name="${name}">${agent.description}</agent>`)}
          </agents>
        `,
      },
      {
        role: 'assistant',
        content: 'What is the task?',
      },
      ...state.messages,
    ],
    temperature: 0.1,
    response_format: zodResponseFormat(
      z.object({
        agent: z.enum(Object.keys(workflow.team) as [string, ...string[]]),
        reasoning: z.string(),
      }),
      'agent_selection'
    ),
  })

  const content = response.choices[0].message.parsed
  if (!content) {
    throw new Error('No content in response')
  }

  const agent = workflow.team[content.agent]
  if (!agent) {
    throw new Error('Invalid agent')
  }

  return workflowState({
    agent,
    messages: state.messages,
  })
}
