# Dead Simple AI Agent

A lightweight, functional, and composable framework for building AI agents that work together to solve complex tasks. 

Built with TypeScript and designed to be serverless-ready.

## Getting started

Most existing AI agent frameworks are either too complex, heavily object-oriented, or tightly coupled to specific infrastructure. 

We wanted something different - a framework that embraces functional programming principles, remains stateless, and stays laser-focused on composability.

**Now, English + Typescript is your tech stack.**

Example:

```typescript
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
  telemetry: logger,
})


// This will block until the workflow is complete
const result = await teamwork(workflow)
console.log(🎁 ' + result);
```

No dependencies required. Run it with simple:

```typescript
bun install
bun example/src/surprise_trip.ts
```

## Why Another AI Agent Framework?



The framework is designed around the idea that AI agents should be:
- Easy to create and compose
- Infrastructure-agnostic
- Stateless by default
- Minimal in dependencies
- Focused on team collaboration

## Core Concepts

### Agents

Agents are specialized workers with specific roles and capabilities. Each agent has:
- A defined role
- A clear description of capabilities
- Optional tools they can use
- A configured language model provider

### Tools

Tools extend agent capabilities by providing concrete actions they can perform. Tools are pure functions with:
- A description
- Typed parameters (using Zod)
- An execute function

### Workflows

Workflows define how agents collaborate to achieve a goal. They specify:
- Team members
- Task description
- Expected output
- Optional configuration

### Iteration

The framework provides two main ways to orchestrate agent collaboration:

#### Teamwork

The `teamwork` function handles complete workflow execution from start to finish, managing the entire process automatically. It's perfect for simple use cases where you want to get results in a single call.

```typescript
// This will block until the workflow is complete
const result = await teamwork(workflow)
```

#### Iterate

The `iterate` function provides a stateless, step-by-step execution model. Each call returns the new state without maintaining any internal state.

```typescript
// Initialize, or get from storage
const initialState = workflowState(workflow)

// Iterate over the workflow
const newState = await iterate(workflow, initialState)

// Check status
console.log(newState.status)
```

This approach offers several benefits:

- **Pausable Execution**: Stop and resume workflow execution at any point
- **State Persistence**: Save the state between iterations to your preferred storage
- **Progress Monitoring**: Inspect the workflow state after each iteration
- **Error Recovery**: Handle failures gracefully by retrying from the last successful state
- **Custom Control Flow**: Implement your own execution patterns and recovery strategies

This functional approach makes the framework particularly well-suited for building long-running workflows that are distributed across multiple servers in the cloud.


