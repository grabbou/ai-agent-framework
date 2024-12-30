import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { githubProjectReport } from './github_docx_report.config.js'

const result = await teamwork(githubProjectReport)

console.log(solution(result))
