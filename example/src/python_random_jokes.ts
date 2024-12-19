/**
 * Example borrowed from CrewAI.
 */
import { codeInterpreter } from '@fabrice-ai/tools/codeInterpreter'
import { agent } from 'fabrice-ai/agent'
import { teamwork } from 'fabrice-ai/teamwork'
import { workflow } from 'fabrice-ai/workflow'

const joker = agent({
  description: `
    You are skilled at writing funny jokes based on Wikipedia articles.
    User your skills to write the jokes.
  `,
  tools: {
    codeInterpreter,
  },
})

const randomJokesScriptWorkflow = workflow({
  team: {
    joker,
  },
  description: `
    Our goal is to create and run a Python 3 script
    that will display single random joke.

    The jokes should prepared beforehand - the script will just display them.
    Generate two raondom jokes
    Interpret the script by code interpreter to print the last line - the joke itself.

    Focus:
      - Jokes should be funny, yet based on real facts
      - The app should display single joke at a time
      - The script must be executed by code interprteter      
  `,
  output: `
    The final output of the interpreting Python Script - be a single joke displayed at a time.
  `,
})

const result = await teamwork(randomJokesScriptWorkflow)

console.log(result)
