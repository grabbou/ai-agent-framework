import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { createHelloworldNodeProject } from './shell_node_project.config.js'

const result = await teamwork(createHelloworldNodeProject)

console.log(solution(result))
