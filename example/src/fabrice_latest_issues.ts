import 'dotenv/config'

import { httpTool } from '@fabrice-ai/tools/http'
import { agent } from 'fabrice-ai/agent'
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { logger } from 'fabrice-ai/telemetry'
import { workflow } from 'fabrice-ai/workflow'

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

const checkupGithubProject = workflow({
  team: { browser, wrapupRedactor },
  description: `
    Check the project details for "fabrice-ai" using the following API URL:
    "https://api.github.com/repos/callstackincubator/fabrice-ai".

    From the data received get the number of stars and the URL for the listing the issues.
    List last top 3 issues and the number of star gazers for the project.
  `,
  output: `
    Comprehensive markdown report for fabrice-ai project:
    - Include top 3 new issues.
    - Include the actual number of star gazers.
  `,
  snapshot: logger,
})

const result = await teamwork(checkupGithubProject)

console.log(solution(result))
