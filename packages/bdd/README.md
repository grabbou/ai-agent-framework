# BDD Testing with Fabrice AI

This guide provides an example of how to write BDD (Behavior-Driven Development) tests using the Fabrice AI framework. The example is based on the `library_photo_to_website.test.ts` file.

## Example: Library Photo to Website

This example demonstrates how to test a workflow that converts a photo of a library into a browsable web catalog. [See full example](../../example/src/library_photo_to_website.test.ts).

### Step-by-Step Guide

1. **Import necessary modules and dependencies:**

```typescript
import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'
import fs from 'fs/promises'

import { bookLibraryWorkflow, outputPath, workingDir } from './library_photo_to_website.workflow.js'
```

This example somewhat defines the rule convention of saving the workflow in the `*.workflow.ts` files - so it will be reusable - between tests and executable code. 

Full set of executable/test/workflow files is:
1. `example/src/library_photo_to_website.workflow.ts` - workflow definition,
2. `example/src/library_photo_to_website.test.ts` - test suite,
3. `example/src/library_photo_to_website.ts` - executable code.

Having this in mind one could use the following commands to run:

- Running tests:
```ts
$ tsx library_photo_to_website.test.ts
```

- Running workflow:
```ts
$ tsx library_photo_to_website.ts
```


2. **Define the test suite and test cases:**

```ts
const testResults = await testwork(
  bookLibraryWorkflow,
  suite({
    description: 'Black box testing suite',
    team: {
      librarian: [
        test(
          '1_vision',
          'Librarian should use the vision tool to OCR the photo of the book library to text'
        ),
      ],
      webmaster: [
        test(
          '2_listFilesFromDirectory',
          'Webmaster should list the files from working directory using "listFilesFromDirectory" tool'
        ),
        test(
          '3_saveFile',
          `Webmaster should modify and save final HTML to ${outputPath} file using "saveFile" tool`
        ),
      ],
    },
    workflow: [
      test(
        '4_search_template',
        `Webmaster should search and MUST choose the "book_library_template.html" template from inside the ${workingDir} directory.`
      ),
      test(
        '5_finalOutput',
        'Final list of the books should be at least 5 books long and saved to the HTML file'
      ),
      test(
        '6_finalOutput',
        `Final output consist "Female Masculinity" title in the ${outputPath} file`,
        async (workflow, state) => {
          const htmlContent = await fs.readFile(outputPath, 'utf-8')
          return {
            reasoning: "Output file includes the 'Female Masculinity' title",
            passed: htmlContent.includes('Female Masculinity'),
            id: '6_finalOutput',
          }
        }
      ),
    ],
  })
)

```

3. **Handle the results:**

```ts
if (!testResults.passed) {
  console.log('🚨 Test suite failed')
  process.exit(-1)
} else {
  console.log('✅ Test suite passed')
  process.exit(0)
}
```

## Running the Tests

To run the tests, execute the following command:

```ts
$ tsx library_photo_to_website.test.ts
```

This will run the test suite and output the results to the console.

## API

The testing framework API is pretty straightforward.

### `testwork`

Runs the given workflow and continues iterating over the workflow until it finishes. If you handle running tools manually, you can set `runTools` to false.

#### Parameters

- `workflow: Workflow`: The workflow to be tested.
- `suite: TestSuite`: The test suite containing the test cases.
- `state: WorkflowState`: The initial state of the workflow. Defaults to `rootState(workflow)`.
- `runTools: boolean`: Whether to run tools automatically. Defaults to `true`.

#### Returns

- `Promise<TestSuiteResult>`: The overall result of the test suite.

#### Example Usage

```ts
import { testwork } from '@fabrice-ai/bdd/testwork'
const testResults = await testwork(
  bookLibraryWorkflow,
  suite({ ... })
)
if (!testResults.passed) {
  console.log('🚨 Test suite failed')
  process.exit(-1)
} else {
  console.log('✅ Test suite passed')
  process.exit(0)
}
```

### `suite`

Creates a test suite with the given options.

#### Parameters

- `options: TestSuiteOptions`: The options for creating the test suite.

#### Returns

- `TestSuite`: The created test suite.

#### Example Usage

```ts
import { suite, test } from '@fabrice-ai/bdd/suite'

const myTestSuite = suite({
  description: 'Example test suite',
  workflow: [
    test('1_exampleTest', 'This is an example test case'),
  ],
  team: {
    exampleAgent: [
      test('2_exampleAgentTest', 'This is an example test case for an agent'),
    ],
  },
})
```


### `test`
Creates a test case with the given id, description, and optional run function.

#### Parameters
`id: string`: The unique identifier for the test case.
`testCase: string`: The description of the test case.
r`un?: ((workflow: Workflow, state: WorkflowState) => Promise<SingleTestResult>) | null`: The optional function to run the test case.

### Returns
`TestCase`: The created test case.

### Example usage

```ts
import { test } from '@fabrice-ai/bdd/suite'

const exampleTestCase = test('1_exampleTest', 'This is an example test case')

const exampleAgentTestCase = test(
  '2_exampleAgentTest',
  'This is an example test case for an agent',
  async (workflow, state) => {
    // Custom test logic
    return {
      passed: true,
      reasoning: 'Test passed successfully',
      id: '2_exampleAgentTest',
    }
  }
)
```

## Mocking tools

You are able to very easily mock-up the tools used by the agents. For example: tools requesting user attention, or answers could be mocked using the LLM as answering machines - to keep the tests automatic.

Here is just a quick example from the [medical_survey.test.ts](../../example/src/medical_survey.test.ts):

```ts
export const askUserMock = tool({
  description: 'Tool for asking user a question',
  parameters: z.object({
    query: z.string().describe('The question to ask the user'),
  }),
  execute: async ({ query }, { provider }): Promise<string> => {
    const response = await provider.chat({
      messages: [
        {
          role: 'system',
          content: `We are role playing - a nurse is asking a patient about their symptoms
          and the patient is answering. The nurse will ask you a question and you should answer it.
          Figure out something realistic! It's just a play!`,
        },
        {
          role: 'user',
          content: 'Try to answer this question in a single line: ' + query,
        },
      ],
      response_format: {
        result: z.object({
          answer: z.string().describe('Answer to the question'),
        }),
      },
    })
    console.log(`😳 Mocked response: ${response.value.answer}\n`)
    return Promise.resolve(response.value.answer)
  },
})

preVisitNoteWorkflow.team['nurse'].tools = {
  askPatient: askUserMock,
}
```


## Conclusion

This example demonstrates how to write BDD tests using the Fabrice AI framework. By defining a test suite and test cases, you can validate the behavior of your workflows and ensure they meet the expected requirements. ```