import { WorkflowState } from 'fabrice-ai/state'
import { Workflow } from 'fabrice-ai/workflow'

/**
 * Represents a single test case.
 */
export type TestCase = {
  case: string
  id: string
  run: ((workflow: Workflow, state: WorkflowState) => Promise<SingleTestResult>) | null
}

/**
 * Represents a test suite containing multiple test cases.
 */
export type TestSuite = {
  description: string
  workflow: TestCase[]
  team: {
    [key: string]: TestCase[]
  }
}

/**
 * Options for creating a test suite.
 */
export type TestSuiteOptions = TestSuite

/**
 * Represents the result of a single test case.
 */
export type SingleTestResult = {
  passed: boolean
  reasoning: string
  id: string
}

/**
 * Represents the success result of a test suite.
 */
export type TestResultsSuccess = {
  tests: SingleTestResult[]
}

/**
 * Represents the failure result of a test suite.
 */
export type TestResultsFailure = { reasoning: string; id: string }

/**
 * Represents the results of a test suite.
 */
export type TestResults = TestResultsSuccess | TestResultsFailure

/**
 * Represents the overall result of a test suite.
 */
export type TestSuiteResult = {
  passed: boolean
  results: TestResults[]
}

const defaults = {
  passed: false,
}

/**
 * Represents a request to run a test suite.
 */
export type TestRequest = {
  workflow: Workflow
  state: WorkflowState
  teamRouting: Array<string>
  requestedFor?: string
  tests: TestCase[]
}

/**
 * Creates a test suite with the given options.
 *
 * @param options - The options for creating the test suite.
 * @returns The created test suite.
 */
export const suite = (options: TestSuiteOptions): TestSuite => {
  return {
    ...defaults,
    ...options,
  }
}

/**
 * Creates a test case with the given id, description, and optional run function.
 *
 * @param id - The unique identifier for the test case.
 * @param testCase - The description of the test case.
 * @param run - The optional function to run the test case.
 * @returns The created test case.
 */
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
