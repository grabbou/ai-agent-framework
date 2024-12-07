/**
 * Example borrowed from CrewAI.
 */
import { agent } from '@dead-simple-ai-agent/framework/agent'
import { memory } from '@dead-simple-ai-agent/framework/memory'
import { teamworkStep } from '@dead-simple-ai-agent/framework/step'
import { workflow } from '@dead-simple-ai-agent/framework/workflow'
import { load, save } from '@dead-simple-ai-agent/memory-lowdb'
import { promises as fs } from 'fs'
import { nanoid } from 'nanoid'
import { join } from 'path'

import { lookupWikipedia } from './tools.js'

const personalizedActivityPlanner = agent({
  role: 'Activity Planner',
  description: `
    You are skilled at creating personalized itineraries that cater to
    the specific preferences and demographics of travelers.
    Your goal is to research and find cool things to do at the destination,
    including activities and events that match the traveler's interests and age group.
  `,
})

const landmarkScout = agent({
  role: 'Landmark Scout',
  description: `
    You are skilled at researching and finding interesting landmarks at the destination.
    Your goal is to find historical landmarks, museums, and other interesting places.
  `,
  tools: {
    lookupWikipedia,
  },
})

const restaurantScout = agent({
  role: 'Restaurant Scout',
  description: `
    As a food lover, you know the best spots in town for a delightful culinary experience.
    You also have a knack for finding picturesque and entertaining locations.
    Your goal is to find highly-rated restaurants and dining experiences at the destination,
    and recommend scenic locations and fun activities.
  `,
})

const itineraryCompiler = agent({
  role: 'Itinerary Compiler',
  description: `
    With an eye for detail, you organize all the information into a coherent and enjoyable travel plan.
    Your goal is to compile all researched information into a comprehensive day-by-day itinerary,
    ensuring the integration of flights and hotel information.
  `,
})

const researchTripWorkflow = workflow({
  members: [personalizedActivityPlanner, restaurantScout, landmarkScout, itineraryCompiler],
  description: `
    Research and find cool things to do in Wrocław, Poland.

    Focus:
      - activities and events that match the traveler's interests and age group.
      - highly-rated restaurants and dining experiences.
      - landmarks with historic context.
      - picturesque and entertaining locations.

    Traveler's information:
      - Origin: New York, USA
      - Destination: Wrocław, Poland
      - Age of the traveler: 30
      - Hotel location: Main Square, Wrocław
      - Flight information: Flight AA123, arriving on 2023-12-15
      - How long is the trip: 7 days
  `,
  output: `
    Comprehensive day-by-day itinerary for the trip to Wrocław, Poland.
    Ensure the itinerary integrates flights, hotel information, and all planned activities and dining experiences.
  `,
})

let id: string
const idFilePath = join(__dirname, 'last-run-id.txt')

if (process.argv.length > 2) {
  id = process.argv[2]
} else {
  try {
    id = await fs.readFile(idFilePath, 'utf-8')
  } catch (error) {
    id = nanoid()
  }
}
await fs.writeFile(idFilePath, id, 'utf-8')

console.log('🛟 Run ID:', id)
console.log('🛟 Executing single next step')

const result = await teamworkStep(
  id,
  researchTripWorkflow,
  memory({
    load,
    save,
  })
) // exec the next step

console.log(result)
