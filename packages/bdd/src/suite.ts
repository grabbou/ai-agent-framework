import { WorkflowState } from 'fabrice-ai/state'
import { Workflow } from 'fabrice-ai/workflow'

export type TestCase = {
  case: string
  id: string
  checked?: boolean
}
export type TestSuite = {
  description: string
  workflow: TestCase[]
  team: {
    [key: string]: TestCase[]
  }
}
export type TestSuiteOptions = TestSuite

export type TestResultsSuccess = {
  tests: {
    checked: boolean
    id: string
  }[]
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
