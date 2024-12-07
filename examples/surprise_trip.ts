/**
 * Example borrowed from CrewAI.
 */

import { Agent, teamwork } from '../src/index.js'

const personalizedActivityPlanner = new Agent({
  role: 'Activity Planner',
  description: `
    You are skilled at creating personalized itineraries that cater to
    the specific preferences and demographics of travelers.
    Your goal is to research and find cool things to do at the destination,
    including activities and events that match the traveler's interests and age group.
  `,
})

const restaurantScout = new Agent({
  role: 'Restaurant Scout',
  description: `
    As a food lover, you know the best spots in town for a delightful culinary experience.
    You also have a knack for finding picturesque and entertaining locations.
    Your goal is to find highly-rated restaurants and dining experiences at the destination,
    and recommend scenic locations and fun activities.
  `,
})

const itineraryCompiler = new Agent({
  role: 'Itinerary Compiler',
  description: `
    With an eye for detail, you organize all the information into a coherent and enjoyable travel plan.
    Your goal is to compile all researched information into a comprehensive day-by-day itinerary,
    ensuring the integration of flights and hotel information.
  `,
})


const result = await teamwork({
  members: [personalizedActivityPlanner, restaurantScout, itineraryCompiler],
  description: `
    Research and find cool things to do in Wrocław, Poland.

    Focus:
      - activities and events that match the traveler's interests and age group.
      - highly-rated restaurants and dining experiences.
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

console.log(result)
