import { WorkflowState } from 'fabrice-ai/state'
import { Workflow } from 'fabrice-ai/workflow'

export type TestCase = {
  case: string
  id: string
  run: ((workflow: Workflow, state: WorkflowState) => Promise<SingleTestResult>) | null
}
export type TestSuite = {
  description: string
  workflow: TestCase[]
  team: {
    [key: string]: TestCase[]
  }
}
export type TestSuiteOptions = TestSuite

export type SingleTestResult = {
  passed: boolean
  reasoning: string
  id: string
}

export type TestResultsSuccess = {
  tests: SingleTestResult[]
}
export type TestResulstsFailure = { reasoning: string }
export type TestResults = TestResultsSuccess | TestResulstsFailure

export type TestSuiteResult = {
  passed: boolean
  results: TestResults[]
}

const defaults = {
  passed: false,
}

export type TestRequest = {
  workflow: Workflow
  state: WorkflowState
  agentsRouting: Array<string>
  tests: TestCase[]
}

export const suite = (options: TestSuiteOptions): TestSuite => {
  return {
    ...defaults,
    ...options,
  }
}

export const test = (
  id: string,
  testCase: string,
  run?: ((workflow: Workflow, state: WorkflowState) => Promise<SingleTestResult>) | null
): TestCase => {
  return {
    id,
    case: testCase,
    run: run || null,
  }
}
