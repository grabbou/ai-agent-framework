import 'dotenv/config'

import { httpTool } from '@fabrice-ai/tools/http'
import { createEmailTool } from '@fabrice-ai/tools/resend'
import { getApiKey } from '@fabrice-ai/tools/utils'
import { agent } from 'fabrice-ai/agent'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'

import { askUser } from './tools/askUser.js'

const apiKey = await getApiKey('Resend.com API Key', 'RESEND_API_KEY')
const fromEmail = await getApiKey(
  'Resend.com "From" email compliant with API Key domain',
  'RESEND_FROM_EMAIL'
) // must be compliant with API Key settings

const human = agent({
  description: `
  Use askUser tool to get the required input information for other agents`,
  tools: {
    askUser,
  },
})

const browser = agent({
  description: `
    You are skilled at browsing Web with specified URLs, 
    methods, params etc.
    You are using "httpTool" to get the data from the API and/or Web pages.
  `,
  tools: {
    httpTool,
  },
})

const wrapupRedactor = agent({
  description: `
    Your role is to check Github project details and check for latest issues.
  `,
})

const emailSender = agent({
  description: `
  Your role is to send the report over email to address provided by the human`,
  tools: {
    ...createEmailTool({
      apiKey,
    }),
  },
})

export const checkupGithubProject = workflow({
  team: { human, browser, wrapupRedactor, emailSender },
  description: `
    Ask human for the Github project locator: "<organization>/<project-handle>".
    Browse the following URL: "https://api.github.com/repos/<organization>/<project-handle>".

    From the data received get the number of stars and the URL for the listing the issues.
    List last top 3 issues and the number of star gazers for the project.

    Ask user for the "To" e-mail address.
    Use the "${fromEmail}" as "From" e-mail address.
    Create a simple HTML report and send it over to the email provided.
  `,
  output: `
    E-mail delivered HTML report about the specified project:
    - Include top 3 new issues.
    - Include the actual number of star gazers.
  `,
  snapshot: logger,
})
