import s from 'dedent'
import { zodResponseFormat } from 'openai/helpers/zod.mjs'
import { z } from 'zod'

import { Agent } from '../agent.js'
import { Provider } from '../models/openai.js'

export async function selectAgent(
  provider: Provider,
  task: string,
  agents: Agent[]
): Promise<Agent> {
  const response = await provider.completions({
    model: provider.model,
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
          Here is the task:
          <task>${task}</task>

          Here are the available agents:
          <agents>
            ${agents.map((agent, index) => `<agent index="${index}">${agent}</agent>`)}
          </agents>

          Select the most suitable agent for this task.
        `,
      },
    ],
    temperature: 0.1,
    response_format: zodResponseFormat(
      z.object({
        agentIndex: z.number(),
        reasoning: z.string(),
      }),
      'agent_selection'
    ),
  })

  const content = response.choices[0].message.parsed
  if (!content) {
    throw new Error('No content in response')
  }

  const agent = agents[content.agentIndex]
  if (!agent) {
    throw new Error('Invalid agent')
  }

  return agent
}
