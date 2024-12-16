import s from 'dedent'
import { assistant, getSteps, Message, system, user } from 'fabrice-ai/messages'
import { Provider } from 'fabrice-ai/models'
import { rootState, WorkflowState } from 'fabrice-ai/state'
import { Workflow } from 'fabrice-ai/workflow'
import { z } from 'zod'

import { iterate } from './iterate.js'
import { TestResults, TestSuite } from './suite.js'

export async function testWorkflow(
  workflow: Workflow,
  state: WorkflowState,
  suite: TestSuite
): Promise<TestResults> {
  console.log('🧪 Running test suite for workflow... ')
  // tbd: move it to a specialized agent
  // evaluate test cases every iterate call - however it could be potentially optimized
  // to run once at the end.
  const suiteResults = await workflow.provider.chat({
    messages: [
      system(s`
      You are a LLM test agent.

      Your job is to go thru test cases and evaluate them against the current state.
      If test case is satisfied mark it checked.

      Here is the test suite:

      <suite>
        ${suite.workflow.map((testCase) => {
          return `<test>
                        <id>${testCase.id}</id>
                        <case>${testCase.case}</case>
                        <checked> ${testCase.checked ? 'checked' : 'unchecked'}</checked>
                    </test>`
        })}
      </suite>
    `),
      assistant('What have been done so far?'),
      user(`Here is the task flow so far:`),
      ...state.messages,
      assistant(`Who is working on the task right now?`),
      user(`Right now ${state.agent} is working on the task`),
      user(`Here is the state of the current agent`),
      ...getSteps(state.children.flatMap((child) => child.messages)),
      assistant(`Is there anything else I need to know?`),
      workflow.knowledge
        ? user(`Here is all the knowledge available: ${workflow.knowledge}`)
        : user(`No, I do not have any additional information.`),
      assistant('What is the request?'),
      ...state.messages,
    ],

    response_format: {
      suite: z.object({
        tests: z.array(
          z.object({
            id: z.string().describe('The id of the test case'),
            checked: z.boolean().describe('The test case is checked or not'),
          })
        ),
      }),
      error: z.object({
        reasoning: z.string().describe('The reason why you cannot complete the tests'),
      }),
    },
  })

  return suiteResults.value
}

export async function testAgent(
  agentName: string,
  workflow: Workflow,
  state: WorkflowState,
  suite: TestSuite
): Promise<TestResults> {
  const agentSuite = suite.team[agentName]
  if (!agentSuite) {
    return { reasoning: `No test suite found for agent: ${agentName}` }
  }
  console.log(`🧪 Running test suite for agent [${agentName}]`)

  // tbd: move it to a specialized agent
  // evaluate test cases every iterate call - however it could be potentially optimized
  // to run once at the end.
  const suiteResults = await workflow.provider.chat({
    messages: [
      system(s`
      You are a LLM test agent.

      Your job is to go thru test cases and evaluate them against the work done by the agent.
      If test case is satisfied mark it checked.

      Here is the test suite:

      <suite>
        ${agentSuite.map((testCase) => {
          return `<test>
                        <id>${testCase.id}</id>
                        <case>${testCase.case}</case>
                        <checked> ${testCase.checked ? 'checked' : 'unchecked'}</checked>
                    </test>`
        })}
      </suite>
    `),
      user(`${state.agent} just finished the task by executing the following steps:`),
      ...state.messages,
      user(`Here is the state of the current agent children`),
      ...getSteps(state.children.flatMap((child) => child.messages)),
      assistant(`Is there anything else I need to know?`),
      workflow.knowledge
        ? user(`Here is all the knowledge available: ${workflow.knowledge}`)
        : user(`No, I do not have any additional information.`),
      assistant('What is the request?'),
      ...state.messages,
    ],

    response_format: {
      suite: z.object({
        tests: z.array(
          z.object({
            id: z.string().describe('The id of the test case'),
            checked: z.boolean().describe('The test case is checked or not'),
          })
        ),
      }),
      error: z.object({
        reasoning: z.string().describe('The reason why you cannot complete the tests'),
      }),
    },
  })

  return suiteResults.value
}

export const displayTestResults = (results: TestResults) => {
  if ('tests' in results) {
    console.log('🧪 Test results: ')
    results.tests.map((testResult) => {
      console.log(`${testResult.checked ? '✅' : '🚨'} for test case [${testResult.id}]`)
    })
  }
}

let agentsMapped = false
/**
 * Teamwork runs given workflow and continues iterating over the workflow until it finishes.
 * If you handle running tools manually, you can set runTools to false.
 */
export async function testwork(
  workflow: Workflow,
  suite: TestSuite,
  state: WorkflowState = rootState(workflow),
  runTools: boolean = true
): Promise<WorkflowState> {
  if (state.status === 'finished') {
    const workflowTestResults = await testWorkflow(workflow, state, suite)
    displayTestResults(workflowTestResults)

    return state
  }
  if (runTools === false && hasPausedStatus(state)) {
    return state
  }

  if (state.status === 'idle' && agentsMapped === false) {
    agentsMapped = true
    Object.entries(workflow.team).map(([agentName, agent]) => {
      workflow.team[agentName] = {
        ...agent,
        run: async (
          provider: Provider,
          state: WorkflowState,
          context: Message[],
          workflow: Workflow
        ) => {
          const nextAgentState = await agent.run(provider, state, context, workflow)
          if (nextAgentState.status === 'finished') {
            if (suite.team[agentName]) {
              const agentTestResults = await testAgent(agentName, workflow, nextAgentState, suite)
              console.log(agentTestResults)
              displayTestResults(agentTestResults)
            } else {
              console.log(`👍 No test suite found for agent: ${agentName}`)
            }
          }
          return nextAgentState
        },
      }
    })
  }

  return testwork(workflow, suite, await iterate(workflow, suite, state), runTools)
}

/**
 * Recursively checks if any state or nested state has a 'paused' status
 */
export const hasPausedStatus = (state: WorkflowState): boolean => {
  if (state.status === 'paused') {
    return true
  }
  return state.children.some(hasPausedStatus)
}
