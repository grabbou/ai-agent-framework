/**
 * Example borrowed from CrewAI.
 */
import { agent } from '@dead-simple-ai-agent/framework/agent'
import { teamwork } from '@dead-simple-ai-agent/framework/teamwork'
import { workflow } from '@dead-simple-ai-agent/framework/workflow'
import { codeInterpreter } from '@dead-simple-ai-agent/tools'

import { lookupWikipedia } from './tools.js'

const joker = agent({
  role: 'Joker',
  description: `
    You are skilled at writing funny jokes based on Wikipedia articles.
    User your skills to write the jokes.
  `,
  tools: {
    codeInterpreter,
  },
})

const randomJokesScriptWorkflow = workflow({
  members: [joker],
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
