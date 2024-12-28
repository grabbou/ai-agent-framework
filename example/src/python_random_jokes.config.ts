import { createCodeInterpreter } from '@fabrice-ai/tools/interpreter'
import { agent } from 'fabrice-ai/agent'
import { workflow } from 'fabrice-ai/workflow'
import path from 'path'

const joker = agent({
  description: `
    You are skilled at writing funny jokes.
    User your skills to write the jokes.
  `,
})

// @ts-ignore
export const workingDir = path.resolve(import.meta.dirname, '../assets/')
const coder = agent({
  description: `
        You are skilled at writing Python code.
    `,
})

const runner = agent({
  description: `
        You are skilled at running Python code.
        Can use the "codeInterpreter" tool to interpret the generated Python code.
    `,
  tools: createCodeInterpreter({
    mountPointDir: 'mnt',
    workingDir,
    dockerOptions: {},
  }),
})

export const randomJokesScriptWorkflow = workflow({
  team: {
    joker,
    coder,
    runner,
  },
  description: `
    Our goal is to create and run a Python 3 script
    that will display single random joke.

    The jokes should prepared beforehand and included in Python source code.
    Generate the code displaing to "stdout" a joke - including 2 random jokes as an array in the code.
    Run the script using the "codeInterpreter" tool. 
    Display the output line it returned (a joke).`,
  knowledge: `
    Focus:
      - Jokes should be funny, yet based on real facts
      - The script must be executed by code interprteter
      - The "codeInterpreter" tool should be executed exactly once
      - "codeInterpreter" can install libraries but pass only non-built in libraries otherwise it will gets you an error  
  `,
  output: `
    The final output of the interpreting Python Script - a randomly selected joke.
  `,
})
