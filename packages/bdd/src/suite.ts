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

const defaults = {
  checked: false,
}

export const suite = (options: TestSuiteOptions): TestSuite => {
  return {
    ...defaults,
    ...options,
  }
}
