import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { bookLibraryWorkflow } from './library_photo_to_website.workflow.js'

const result = await teamwork(bookLibraryWorkflow)

console.log(solution(result))
