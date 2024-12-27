import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'
import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

import { checkupGithubProject } from './github_latest_issues_email.config.js'

export const sendEmailMock = tool({
  description: 'Sends an email using the Resend.com API. Provide "from", "to", "subject", etc.',
  parameters: z.object({
    from: z.string().describe('The "From" address, e.g. "Acme <onboarding@resend.dev>".'),
    to: z
      .array(z.string())
      .describe('The list of recipient email addresses, e.g. ["user@example.com"].'),
    subject: z.string().describe('The subject of the email.'),
    text: z.string().describe('Plaintext body content of the email.'),
    html: z.string().describe('HTML body content of the email.'),
  }),
  execute: async ({ from, to, subject, text, html }) => {
    console.log(`😳 Send e-mail mock called with: \n 
        From: ${from}\n
        To: ${to}\n
        Subject: ${subject}\n
        Text: ${text}
        Html: ${html}
        `)

    return 'Email Sent!'
  },
})

export const askUserMock = tool({
  description: 'Tool for asking user a question',
  parameters: z.object({
    query: z.string().describe('The question to ask the user'),
  }),
  execute: async ({ query }, { provider }): Promise<string> => {
    let response = 'john@example.com'
    if (query.toLowerCase().indexOf('github') > 0) response = 'callstackincubator/fabrice-ai'
    console.log(`😳 Mocked response: ${response}\n`)
    return Promise.resolve(response)
  },
})

checkupGithubProject.team['human'].tools = {
  askUser: askUserMock,
}

checkupGithubProject.team['emailSender'].tools = {
  sendEmail: sendEmailMock,
}

const testResults = await testwork(
  checkupGithubProject,
  suite({
    description: 'Black box testing suite',
    team: {},
    workflow: [
      test('0_ask_for_github_handle', 'Should use the tool to ask user for github handle'),
      test('1_ask_for_email', 'Should ask user for the From and To e-mails'),
      test('2_browse_github', 'Should get the project and the issues list from Github'),
      test('3_create_html_report', 'Should create a HTML report about the project'),
      test('4_send_report', 'Should send the report to e-mail address provided'),
    ],
  })
)

if (!testResults.passed) {
  console.log('🚨 Test suite failed')
  process.exit(-1)
} else {
  console.log('✅ Test suite passed')
  process.exit(0)
}
