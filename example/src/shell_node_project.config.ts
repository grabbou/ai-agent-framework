import 'dotenv/config'

import { createShellTools } from '@fabrice-ai/tools/shell'
import { agent } from 'fabrice-ai/agent'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'
import * as path from 'path'

const shellTools = createShellTools({
  mountPointDir: 'mnt',
  workingDir: path.resolve(import.meta.dirname, '../assets/'),
})

const devops = agent({
  description: `
    You are skilled at operating all sort of Shell commands
    You work on Alpine linux mostly.
  `,
  tools: shellTools,
})

const developer = agent({
  description: `
    You are skilled at writing NodeJS code
  `,
  tools: shellTools,
})

export const createHelloworldNodeProject = workflow({
  team: { devops, developer },
  description: `
    Create a new NodeJS project displaing "Hello World" to console.
    You must plan all necessary steps - including creating a new folder "nodejs-app", a node.js project inside and and a JS script doing the job.
    You need to install all required dependencies to run it.
    The script should display "Hello world" + random number.
    
  `,
  knowledge: `
    - You are on Alpine linux and have "shellExec" tool to run any shell command you want
    - Check if the directories or folders you are about to create doesn't exist and if so remove them.
    - Create folder "nodejs-app" for the project in the current working directory.
    - Work relatively to "/mnt/nodejs-app" (which is the default cwd + "nodejs-app")
    - The Docker container persist between the calls so you can change directories etc. 
    - You can install required packages like nodejs, npm using "apk add --update <packagename>"
    - You should create files and directories using standard linux tools
    - Operate only within a specially created folder called "nodejs-app". Don't modify any files oudside of it.
  `,
  output: `
    Exact text generated to stdout - from index.js script created and executed using the "shellExec" commands.
  `,
  snapshot: logger,
})
