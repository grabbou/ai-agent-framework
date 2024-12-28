import 'dotenv/config'

import { createShellTools } from '@fabrice-ai/tools/shell'
import { agent } from 'fabrice-ai/agent'
import { tool } from 'fabrice-ai/tool'
import { workflow } from 'fabrice-ai/workflow'
import * as path from 'path'
import { z } from 'zod'

import { askUser } from './tools/askUser.js'

// @ts-ignore
export const workingDir = path.resolve(import.meta.dirname, '../assets/')
const shellTools = createShellTools({
  mountPointDir: 'mnt',
  workingDir,
  dockerOptions: {},
  escapeCommand: true,
})

export const print = tool({
  description: 'Print information to the user tool',
  execute: async (parameters) => {
    console.log('🌟 ' + parameters.message)
    return parameters.message
  },
  parameters: z.object({
    message: z.string().describe('The message to be printed to the user.'),
  }),
})

const greetingMaster = agent({
  description: `
    You are responsible for greeting the user. 
    Use the "print" tool to display the art and messages to the user`,
  tools: {
    print,
  },
})

const shellOperator = agent({
  description: `
    You are skilled Linux master, knowing all things shell.
    You role play being a linux shell where user enters what he/she wants to do in plain english.
    You work in a sequence:
    - "askUser" for a command, 
    - explains what you are about to do using "print" tool,
    - executes the command using "shellTool" and prints the results using "print" tool.
    You work on Alpine linux.
  `,
  tools: {
    askUser,
    shellExec: shellTools.shellExec,
    print,
  },
})

export const aiShellWorkflow = workflow({
  team: { greetingMaster, shellOperator },
  description: `
    You are a interactive shell application that works on plain english.
    User enters the next thing they want to do in simple english and you plan how to achieve it using
    all sort of Alpine Linux shell commands. 
    
    For example user says: "List all folders" - and the agent translates it into command "ls -laht".
    You try to print to the user what are you about to do - like: "To list all folders I will execute the 'ps' command ..." 
    then you executes this command, displays result to the user and ask for the next instruction.

    Remember to greet the user first printing welcome message using some cool Emojis.
    
    Welcome message: "Welcome to Interactive English Shell. 
    Tell me what you want to do and I'll translate it into shell commands"

  `,
  knowledge: `
    - First print to the user what commands are you about to execute.
    - You are on Alpine linux and have "shellExec" tool to run any shell command you want
    - Your working directory is "/mnt/"
    - Stop the workflow and stop asking user for next commands when instructed to do so - like they want to quit
    - Do not use Markdown, use emojis instead for example 📁 when listing a folder etc.
    - The Docker container persist between the calls so you can change directories etc. 
    - You can install required packages like nodejs, npm using "apk add --update <packagename>"
    - You should create files and directories using standard linux tools - for example "echo".
  `,
  output: `
    There's no single output. It's just an interactive app. You print the partial results printing it to console
  `,
  snapshot: () => {},
})
