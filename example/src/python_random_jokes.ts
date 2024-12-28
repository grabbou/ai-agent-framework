
import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'
import { randomJokesScriptWorkflow } from './python_random_jokes.config'


const result = await teamwork(randomJokesScriptWorkflow)
console.log(solution(result))