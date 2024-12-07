import s from 'dedent'
import OpenAI from 'openai'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { z } from 'zod'

// tbd: abstract this away or not? most APIs are OpenAI compatible
const openai = new OpenAI()

interface Protocol {
  requestUserInput(prompt: string): Promise<string>
}

// tbd: we should replace this with a "HumanInTheLoop" agent of CLI type
// to do so, we need to implement delegation across different agents
// so they can work collaboratively on smaller tasks too
class CLIProtocol implements Protocol {
  async requestUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      console.log(prompt)
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim())
      })
    })
  }
}

type ToolDefinition<T extends z.ZodObject<{}>> = {
  name: string
  description: string
  parameters: T
  function: (parameters: z.infer<T>) => Promise<string>
}

interface AgentConfig {
  role: string
  description: string
  tools?: ToolDefinition<any>[]
  model?: string
  protocol?: Protocol
}

// tbd: implement short-term and long-term memory with different storage models
export class Agent {
  role: string

  private description: string
  private tools: ToolDefinition<any>[]
  private model: string
  private protocol: Protocol

  constructor({
    role,
    description,
    tools = [],
    model = 'gpt-4o',
    protocol = new CLIProtocol(),
  }: AgentConfig) {
    this.role = role
    this.description = description
    this.tools = tools
    this.model = model
    this.protocol = protocol
  }

  async executeTask(messages: Message[], agents: Agent[]): Promise<string> {
    // tbd: after we implememt this, it keeps delegating
    // const tools = [
    //   {
    //     name: 'ask_a_question',
    //     description: s`
    //       Ask a specific question to one of the following agents:
    //       <agents>
    //         ${agents.map((agent, index) => `<agent index="${index}">${agent.role}</agent>`)}
    //       </agents>
    //     `,
    //     parameters: z.object({
    //       agent: z.number().describe('The index of the agent to ask the question'),
    //       question: z.string().describe('The question you want the agent to answer'),
    //       context: z.string().describe('All context necessary to execute the task'),
    //     }),
    //     function: async ({ agent, question, context }) => {
    //       console.log('ask_a_question', agent, question, context)
    //       const selectedAgent = agents[agent]
    //       if (!selectedAgent) {
    //         throw new Error('Invalid agent')
    //       }
    //       return selectedAgent.executeTask(
    //         [
    //           {
    //             role: 'user',
    //             content: context,
    //           },
    //           {
    //             role: 'user',
    //             content: question,
    //           },
    //         ],
    //         agents
    //       )
    //     },
    //   },
    // ]
    const response = await openai.beta.chat.completions.parse({
      model: this.model,
      // tbd: verify the prompt
      messages: [
        {
          role: 'system',
          content: s`
            You are ${this.role}. ${this.description}
            
            Your job is to complete the assigned task.
            1. You can break down the task into steps
            2. You can use available tools when needed

            First try to complete the task on your own.
            Only ask question to the user if you cannot complete the task without their input.
          `,
        },
        ...messages,
      ],
      // tbd: add other tools
      // tbd: should we include agent description in the prompt too? we need to list responsibilities
      // but keep context window in mind
      tools: this.tools.length > 0 ? this.tools.map(zodFunction) : undefined,
      response_format: zodResponseFormat(
        z.object({
          response: z.discriminatedUnion('kind', [
            z.object({
              kind: z.literal('step'),
              name: z.string().describe('The name of the step'),
              result: z.string().describe('The result of the step'),
              reasoning: z.string().describe('The reasoning for this step'),
            }),
            z.object({
              kind: z.literal('complete'),
              result: z.string().describe('The final result of the task'),
              reasoning: z.string().describe('The reasoning for completing the task'),
            }),
          ]),
        }),
        'task_result'
      ),
    })
    if (response.choices[0].message.tool_calls.length > 0) {
      const toolResults = await Promise.all(
        response.choices[0].message.tool_calls.map(async (toolCall) => {
          if (toolCall.type !== 'function') {
            throw new Error('Tool call is not a function')
          }

          const tool = this.tools.find((t) => t.name === toolCall.function.name)
          if (!tool) {
            throw new Error(`Unknown tool: ${toolCall.function.name}`)
          }

          const content = await tool.function(toolCall.function.parsed_arguments)
          return {
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(content),
          }
        })
      )

      return this.executeTask([...messages, response.choices[0].message, ...toolResults], agents)
    }

    // tbd: verify shape of response
    const result = response.choices[0].message.parsed
    if (!result) {
      throw new Error('No parsed response received')
    }

    if (result.response.kind === 'step') {
      console.log('🚀 Step:', result.response.name)
      return this.executeTask(
        [
          ...messages,
          {
            role: 'assistant',
            content: result.response.result,
          },
        ],
        agents
      )
    }

    if (result.response.kind === 'complete') {
      return result.response.result
    }

    // tbd: check if this is reachable
    throw new Error('Illegal state')
  }

  async requestUserInput(prompt: string): Promise<string> {
    return this.protocol.requestUserInput(prompt)
  }

  toString(): string {
    return s`
      Agent role: "${this.role}"
      Expertise: "${this.description}"
    `
  }
}

type Message = ChatCompletionMessageParam

export class Team {
  async execute(workflow: Workflow): Promise<string> {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: s`
          Here is description of the workflow and expected output by the user:
          <workflow>${workflow.description}</workflow>
          <output>${workflow.output}</output>
        `,
      },
    ]

    // tbd: set reasonable max iterations
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const task = await getNextTask(messages)
      if (!task) {
        return messages.at(-1)!.content as string
      }

      console.log('🚀 Next task:', task)

      messages.push({
        role: 'user',
        content: task,
      })

      // tbd: this throws, handle it
      const selectedAgent = await selectAgent(task, workflow.members)
      console.log('🚀 Selected agent:', selectedAgent.role)

      // tbd: this should just be a try/catch
      // tbd: do not return string, but more information or keep memory in agent
      try {
        const result = await selectedAgent.executeTask(messages, workflow.members)
        messages.push({
          role: 'assistant',
          content: result,
        })
      } catch (error) {
        console.log('🚀 Task error:', error)
        messages.push({
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }
}

type Workflow = {
  description: string
  output: string
  members: Agent[]
}

async function selectAgent(task: string, agents: Agent[]): Promise<Agent> {
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o',
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

async function getNextTask(history: Message[]): Promise<string | null> {
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        // tbd: handle subsequent failures
        content: s`
          You are a planner that breaks down complex workflows into smaller, actionable steps.
          Your job is to determine the next task that needs to be done based on the original workflow and what has been completed so far.
          If all required tasks are completed, return null.

          Rules:
          1. Each task should be self-contained and achievable
          2. Tasks should be specific and actionable
          3. Return null when the workflow is complete
          4. Consider dependencies and order of operations
          5. Use context from completed tasks to inform next steps
        `,
      },
      ...history,
      {
        role: 'user',
        content: 'What is the next task that needs to be done?',
      },
    ],
    temperature: 0.2,
    response_format: zodResponseFormat(
      z.object({
        task: z
          .string()
          .describe('The next task to be completed or null if the workflow is complete')
          .nullable(),
        reasoning: z
          .string()
          .describe('The reasoning for selecting the next task or why the workflow is complete'),
      }),
      'next_task'
    ),
  })

  try {
    const content = response.choices[0].message.parsed
    if (!content) {
      throw new Error('No content in response')
    }

    if (!content.task) {
      return null
    }

    return content.task
  } catch (error) {
    throw new Error('Failed to determine next task')
  }
}
