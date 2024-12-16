import s from 'dedent'
import { iterate } from 'fabrice-ai/iterate'
import { assistant, system, user } from 'fabrice-ai/messages'
import { rootState, WorkflowState } from 'fabrice-ai/state'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger, Telemetry } from 'fabrice-ai/telemetry'
import { Workflow } from 'fabrice-ai/workflow'
import { z } from 'zod'

import { TestCase, TestRequest, TestResults, TestSuite, TestSuiteResult } from './suite.js'

const makeTestingVisitor = (
  workflow: Workflow,
  suite: TestSuite
): {
  testingVisitor: Telemetry
  testRequests: TestRequest[]
} => {
  const testRequests: TestRequest[] = []
  const testingVisitor: Telemetry = async ({ prevState, nextState }) => {
    if (prevState === nextState) return

    if (nextState.status === 'finished') {
      testRequests.push({ workflow, state: nextState, tests: suite.workflow })
    }
    nextState.children.forEach(async (childState) => {
      if (childState.messages.length > 0 && suite.team[childState.agent]) {
        // run tests for finished agents - if defined
        if (nextState.status === 'running') {
          if (!testRequests.find((testRequest) => testRequest.state.agent === childState.agent)) {
            testRequests.push({ workflow, state: childState, tests: suite.team[childState.agent] }) // add it only once
          }
        }
      }
    })
    // printTree(nextState)
    return logger({ prevState, nextState })
  }
  return { testingVisitor, testRequests }
}

export async function test(
  workflow: Workflow,
  state: WorkflowState,
  tests: TestCase[]
): Promise<TestResults> {
  // tbd: move it to a specialized agent
  // evaluate test cases every iterate call - however it could be potentially optimized
  // to run once at the end.
  const testRequest = [
    system(s`
    You are a LLM test agent.

    Your job is to go thru test cases and evaluate them against the current state.
    If test case is satisfied mark it checked.

    If you cannot mark the test case as checked, please return it as a unchecked by default.

    Here is the test suite:

    <suite>
      ${tests.map((test) => {
        return `<test>
                      <id>${test.id}</id>
                      <case>${test.case}</case>
                      <checked>${test.checked ? 'checked' : 'unchecked'}</checked>
                  </test>`
      })}
    </suite>
  `),
    assistant('What have been done so far?'),
    user(`Here is the work flow so far:`),
    ...state.messages,
    assistant(`Who is working on the task right now?`),
    user(`Right now ${state.agent} is working on the task`),
    assistant(`Is there anything else I need to know?`),
    workflow.knowledge
      ? user(`Here is all the knowledge available: ${workflow.knowledge}`)
      : user(`No, I do not have any additional information.`),
  ]
  console.log(testRequest)
  const suiteResults = await workflow.provider.chat({
    messages: testRequest,
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
  } else {
    console.error('🚨 Error: ' + results.reasoning)
  }
}
/**
 * Teamwork runs given workflow and continues iterating over the workflow until it finishes.
 * If you handle running tools manually, you can set runTools to false.
 */
export async function testwork(
  workflow: Workflow,
  suite: TestSuite,
  state: WorkflowState = rootState(workflow),
  runTools: boolean = true
): Promise<TestSuiteResult> {
  const { testingVisitor, testRequests } = makeTestingVisitor(workflow, suite)
  workflow.snapshot = testingVisitor

  const nextState = await teamwork(workflow, await iterate(workflow, state), runTools)
  if (nextState.status === 'finished') {
    const overallResults = await Promise.all(
      testRequests.map((testRequest) => {
        console.log(`🧪 Running test suite [${testRequest.tests.map((t) => t.id).join(', ')}}]`)
        return test(workflow, testRequest.state, testRequest.tests)
      })
    )
    overallResults.forEach(displayTestResults)
    let passed = false
    for (const result of overallResults) {
      displayTestResults(result)
      if ('tests' in result) {
        if (!result.tests.every((test) => test.checked)) {
          passed = false
        } else {
          passed = true
        }
      } else {
        passed = false
        break
      }
    }
    return { passed, results: overallResults }
  }

  if (nextState.status === 'failed') {
    throw Error('Workflow did not finish successfully')
  }

  return await testwork(workflow, suite, nextState, runTools)
}
