import s from 'dedent'
import { run } from 'fabrice-ai/iterate'
import { assistant, getSteps, system, user } from 'fabrice-ai/messages'
import { WorkflowState } from 'fabrice-ai/state'
import { Workflow } from 'fabrice-ai/workflow'
import { z } from 'zod'

import { TestSuite } from './suite.js'

/**
 * Iterates over the workflow and takes a snapshot of the state after each iteration.
 */
export async function iterate(workflow: Workflow, suite: TestSuite, state: WorkflowState) {
  const nextState = await run(state, [], workflow)
  console.log(nextState)

  // tbd: move it to a specialized agent
  // evaluate test cases every iterate call - however it could be potentially optimized
  // to run once at the end.
  workflow.provider.chat({
    messages: [
      system(s`
      You are a LLM test agent.

      Your job is to go thru test cases and evaluate them against the current state.
      If test case is satisfied mark it checked.

      Here is the test suite:

      <suite>
        ${suite.tests.map((testCase) => {
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

  workflow.snapshot({ prevState: state, nextState })
  return nextState
}
