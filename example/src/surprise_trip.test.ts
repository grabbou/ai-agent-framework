import 'dotenv/config'

import { suite, test } from '@fabrice-ai/bdd/suite'
import { testwork } from '@fabrice-ai/bdd/testwork'
import { WorkflowState } from 'fabrice-ai/state'
import { Workflow } from 'fabrice-ai/workflow'

import { researchTripWorkflow } from './surprise_trip.config.js'

const testResults = await testwork(
  researchTripWorkflow,
  suite({
    description: 'Black box testing suite',
    team: {
      landmarkScout: [test('0_wikipedia', 'Should use "lookupWikipedia" tool')],
    },
    workflow: [
      test(
        '1_personalizedActivityPlanner',
        'Should use "personalizedActivityPlanner" to "Research activities and events in Wrocław"'
      ),
      test(
        '2_restaurantScout',
        'Should use "restaurantScount" to "Research restaurants and dining experience in Wrocław"'
      ),
      test('3_landmarkScout', 'Should use "landmarkScout" to "Research landmarks of Wrocław"'),
      test(
        '5_itineraryCompiler',
        '"itineraryCompiler" should compile all the information into a coherent travel plan'
      ),
      test('6_finalOutput', 'Should return a 7 days itinerary as a final output'),
      test(
        '7_snapshot',
        'This is example non LLM check',
        async (workflow: Workflow, state: WorkflowState) => {
          return {
            passed: true,
            reasoning: 'This is example non LLM check',
            id: '7_snapshot',
          }
        }
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
