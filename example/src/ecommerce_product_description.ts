import 'dotenv/config'

import { solution } from 'fabrice-ai/solution'
import { teamwork } from 'fabrice-ai/teamwork'

import { productDescriptionWorkflow } from './ecommerce_product_description.config.js'

const result = await teamwork(productDescriptionWorkflow)

console.log(solution(result))
