import chalk from 'chalk'
import s from 'dedent'
import { iterate } from 'fabrice-ai/iterate'
import { assistant, system, user } from 'fabrice-ai/messages'
import { rootState, WorkflowState } from 'fabrice-ai/state'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger, Telemetry } from 'fabrice-ai/telemetry'
import { isCoreTeam, Workflow } from 'fabrice-ai/workflow'
import { z } from 'zod'

import { SingleTestResult, TestRequest, TestResults, TestSuite, TestSuiteResult } from './suite.js'

const makeTestingVisitor = (
  workflow: Workflow,
  suite: TestSuite
): {
  testingVisitor: Telemetry
  testRequests: TestRequest[]
} => {
  const testRequests: TestRequest[] = []
  const teamRouting = new Array<string>()
  const testingVisitor: Telemetry = async ({ prevState, nextState }) => {
    if (prevState === nextState) return

    if (!isCoreTeam(nextState.agent)) teamRouting.push(nextState.agent)

    if (
      nextState.status === 'finished' &&
      (nextState.agent === 'supervisor' || nextState.agent === 'finalBoss')
    ) {
      // test entire workflow
      testRequests.push({ workflow, state: nextState, tests: suite.workflow, teamRouting })
    }

    if (nextState.status === 'finished' && suite.team[nextState.agent]) {
      // test single agent - prevState is internal agent state
      console.log(`🧪 Requesting test suite for agent [${nextState.agent}]\n`)
      testRequests.push({
        workflow,
        state: prevState,
        tests: suite.team[nextState.agent],
        requestedFor: nextState.agent,
        teamRouting: [],
      }) // add it only once
    }
    // printTree(nextState)
    return logger({ prevState, nextState })
  }
  return { testingVisitor, testRequests }
}

export async function validate(req: TestRequest): Promise<TestResults> {
  // evaluate test cases every iterate call - however it could be potentially optimized
  // to run once at the end.
  const { workflow, state, tests, teamRouting } = req

  const testRequest = [
    system(s`
    You are a LLM test agent.

    Your job is to go thru test cases and evaluate them against the current state.
    If test case is satisfied mark it passed.

    If you cannot mark the test case as passed, please return it as a unpassed by default.

    Here is the test suite:

    <suite>
      ${tests
        .filter((test) => test.run === null) // only run tests that are not defined
        .map((test) => {
          return `<test>
                      <id>${test.id}</id>
                      <case>${test.case}</case>                     
                  </test>`
        })}
    </suite>
  `),
    assistant('What have been done so far?'),
    user(`Here is the work flow so far:`),
    ...state.messages,
    assistant('What was the agent routing?'),
    user(teamRouting.join(' => ')),
    assistant(`Is there anything else I need to know?`),
    workflow.knowledge
      ? user(`Here is all the knowledge available: ${workflow.knowledge}`)
      : user(`No, I do not have any additional information.`),
  ]
  const suiteResults = await workflow.provider.chat({
    messages: testRequest,
    response_format: {
      suite: z.object({
        tests: z.array(
          z.object({
            id: z.string().describe('The id of the test case'),
            reasoning: z.string().describe('The reason - why this test passed or not'),
            passed: z.boolean().describe('The test case is passed or not'),
          })
        ),
      }),
      error: z.object({
        id: z.string().describe('The id of the test case'),
        reasoning: z.string().describe('The reason why you cannot complete the tests'),
      }),
    },
  })

  const testRunners = tests
    .filter((test) => test.run !== null)
    .map((test) => {
      // @ts-ignore
      return test.run(workflow, state)
    })

  const subResults = await Promise.all(testRunners)

  if ('tests' in suiteResults.value) {
    return {
      tests: [...suiteResults.value.tests, ...subResults],
    }
  }

  return suiteResults.value // error - no test results, just the `reasoning` for why it failed
}

const printTestResult = (
  level: number,
  testId: string,
  icon: string,
  message: string,
  reason: string
) => {
  const indent = '  '.repeat(level)
  const arrow = level > 0 ? '└─▶ ' : ''
  console.log(`${indent}${arrow}${icon}${chalk.bold(testId)}: ${message}`)
  console.log(`${indent} 🧠 ${chalk.dim(reason)}`)
}

export const displayTestResults = (results: SingleTestResult[]) => {
  console.log('🧪 Test results: ')
  results.map((testResult) => {
    printTestResult(
      2,
      testResult.id,
      `${testResult.passed ? '✅' : '🚨'}`,
      `${testResult.passed ? 'PASSED' : 'FAIL'}`,
      testResult.reasoning
    )
  })
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
        console.log(`🧪 Running test suite [${testRequest.tests.map((t) => t.id).join(', ')}]\n`)
        return validate(testRequest)
      })
    )

    const finalResults = overallResults.flatMap((result) => {
      if ('tests' in result) return result.tests
      else return [{ ...result, passed: false }] // case of general issue with the whole set of tests
    })
    const requiredAgentCalls = Object.keys(suite.team)
    const missingAgentCalls = requiredAgentCalls
      .map((requiredAgent) =>
        !testRequests.find((req) => req.requestedFor === requiredAgent) ? requiredAgent : null
      )
      .filter((agent) => agent !== null)

    if (missingAgentCalls.length > 0) {
      console.log(`🚨 Missing test suites for agents: ${missingAgentCalls}\n`)
      finalResults.push({
        passed: false,
        reasoning: 'Missing test suites for agents: ' + missingAgentCalls.join(', '),
        id: 'missing_agent_calls',
      })
      missingAgentCalls.forEach((agent) => {
        suite.team[agent].forEach((test) => {
          finalResults.push({
            passed: false,
            reasoning: 'Missing call for agent ' + agent,
            id: test.id,
          })
        })
      })
    }

    displayTestResults(finalResults)
    return { passed: finalResults.every((test) => test.passed), results: overallResults }
  }

  if (nextState.status === 'failed') {
    throw Error('Workflow did not finish successfully')
  }

  return await testwork(workflow, suite, nextState, runTools)
}
