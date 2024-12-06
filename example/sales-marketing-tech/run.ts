import { z } from 'zod'

import { Agent, Team } from '../../src/index.js'

const human = new Agent({
  prompt: `You are a human. You can answer questions that you are asked.`,
  tools: [
    {
      name: 'prompt',
      description: 'Prompt the human with a question',
      parameters: z.object({
        question: z.string(),
      }),
      execute: async ({ question }) => {
        return new Promise((resolve) => {
          console.log(question)
          process.stdin.once('data', (data) => {
            resolve(data.toString().trim())
          })
        })
      },
    },
  ],
})

// Business Team Agents
const marketingManager = new Agent({
  prompt: `You are a Marketing Manager with expertise in:
  - Digital marketing strategy
  - Brand development and management
  - Marketing campaign planning
  - Analytics and performance tracking
  - Content strategy and social media`,
})

const salesManager = new Agent({
  prompt: `You are a Sales Manager with expertise in:
  - Sales strategy and pipeline management
  - Customer relationship management
  - Sales forecasting and analytics
  - Team performance optimization
  - Deal negotiation and closing strategies`,
})

const technicalManager = new Agent({
  prompt: `You are a Technical Manager with expertise in:
  - Technical infrastructure planning
  - System architecture and integration
  - Technology stack evaluation
  - Development process optimization
  - Technical resource allocation`,
})

// Create team
const team = new Team({
  agents: [human, marketingManager, salesManager, technicalManager],
})

// Business alignment workflow
const alignmentWorkflow = `
  Quarterly Business Alignment Meeting Agenda:
   - Review current marketing campaigns and their technical requirements
   - Analyze sales pipeline and identify technology bottlenecks
   - Discuss integration needs between CRM and marketing automation
   - Plan resource allocation for upcoming projects
   - Establish KPIs for cross-team collaboration

  Please provide recommendations for:
   - Improving customer journey tracking across departments
   - Streamlining lead handoff process
   - Technical infrastructure improvements to support growth

  The goal is to create an action plan that aligns marketing initiatives, 
  sales objectives, and technical capabilities for the next quarter.
`

// Run the workflow
console.log('🚀 Starting business alignment workflow...')

await team.ask(alignmentWorkflow)

console.log('✅ Alignment meeting completed successfully')
