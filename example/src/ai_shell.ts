import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { aiShellWorkflow } from './ai_shell.config.js'

const result = await teamwork(aiShellWorkflow)

console.log(solution(result))
