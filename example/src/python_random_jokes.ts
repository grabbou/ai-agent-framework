/**
 * Example borrowed from CrewAI.
 */
import { codeInterpreter } from '@fabrice-ai/tools/codeInterpreter'
import { agent } from 'fabrice-ai/agent'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { workflow } from 'fabrice-ai/workflow'

const joker = agent({
  description: `
    You are skilled at writing funny jokes.
    User your skills to write the jokes.
  `,
})

const coder = agent({
  description: `
        You are skilled at writing and runnign Python code.
        Can use the "codeInterpreter" tool to interpret the generated Python code.
    `,
  tools: {
    codeInterpreter,
  },
})

const randomJokesScriptWorkflow = workflow({
  team: {
    joker,
    coder,
  },
  description: `
    Our goal is to create and run a Python 3 script
    that will display single random joke.

    The jokes should prepared beforehand and included in Python source code.
    Generate the code displaing to "stdout" a joke - including 2 random jokes as an array in the code.
    Run the script using the "codeInterpreter" tool. 
    Display the output line it returned (a joke).

    Focus:
      - Jokes should be funny, yet based on real facts
      - The script must be executed by code interprteter
      - "codeInterpreter" can install libraries but pass only non-built in libraries otherwise it will gets you an error  
  `,
  output: `
    The final output of the interpreting Python Script - a randomly selected joke.
  `,
})

const result = await teamwork(randomJokesScriptWorkflow)
console.log(solution(result))
