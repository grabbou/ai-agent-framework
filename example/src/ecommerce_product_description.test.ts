import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'

import { productDescriptionWorkflow } from './ecommerce_product_description.config.js'

const testResults = await testwork(
  productDescriptionWorkflow,
  suite({
    description: 'Black box testing suite',
    team: {
      techExpert: [test('0_wikipedia', 'Should use "visionTool"')],
    },
    workflow: [
      test(
        '1_photo_description',
        'The photo shows blue pair of shoes. Make sure the description includes the color and type of the shoes'
      ),
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
