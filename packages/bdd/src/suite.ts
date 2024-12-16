export type TestCase = {
  case: string
  id: string
  checked?: boolean
}
export type TestSuite = {
  description: string
  tests: TestCase[]
}
export type TestSuiteOptions = TestSuite

const defaults = {
  checked: false,
}

export const suite = (options: TestSuiteOptions): TestSuite => {
  return {
    ...defaults,
    ...options,
  }
}
