import { WorkflowState } from 'fabrice-ai/state'
import { Workflow } from 'fabrice-ai/workflow'

export type TestCase = {
  case: string
  id: string
  checked?: boolean
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
  checked: boolean
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
  checked: false,
}

export type TestRequest = {
  workflow: Workflow
  state: WorkflowState
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
    checked: false,
    run: run || null,
  }
}
