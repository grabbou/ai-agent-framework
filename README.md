# Dead Simple AI Agent

A lightweight, functional, and composable framework for building AI agents that work together to solve complex tasks. 

Built with TypeScript and designed to be serverless-ready.

## Getting Started

It is very easy to get started. All you have to do is to create a file with your agents and workflow, then run it.

### Installing the framework from `npm`

```bash
$ npm install @dead-simple-ai-agent/framework
```

### Create your first workflow

Here is a simple example of a workflow that researches and plans a trip to Wrocław, Poland:

```ts
// First, import all the necessary functions
import { agent } from '@dead-simple-ai-agent/framework/agent'
import { teamwork } from '@dead-simple-ai-agent/framework/teamwork'
import { logger } from '@dead-simple-ai-agent/framework/telemetry/console'
import { workflow } from '@dead-simple-ai-agent/framework/workflow'

// Then, define your agents:

// This agent is responsible for researching and finding cool things to do at the destination.
const activityPlanner = agent({
  role: 'Activity Planner',
  description: `
    You are skilled at creating personalized itineraries that cater to
    the specific preferences and demographics of travelers.
    Your goal is to research and find cool things to do at the destination,
    including activities and events that match the traveler's interests and age group.
  `,
})

// This agent is responsible for researching and finding interesting landmarks at the destination. 
// It uses Wikipedia as a source of information.
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

// This agent is responsible for researching and finding highly-rated restaurants at the destination.
const restaurantScout = agent({
  role: 'Restaurant Scout',
  description: `
    As a food lover, you know the best spots in town for a delightful culinary experience.
    You also have a knack for finding picturesque and entertaining locations.
    Your goal is to find highly-rated restaurants and dining experiences at the destination,
    and recommend scenic locations and fun activities.
  `,
})

// This agent is responsible for compiling all the information into a coherent and enjoyable travel plan.
const itineraryCompiler = agent({
  role: 'Itinerary Compiler',
  description: `
    With an eye for detail, you organize all the information into a coherent and enjoyable travel plan.
    Your goal is to compile all researched information into a comprehensive day-by-day itinerary,
    ensuring the integration of flights and hotel information.
  `,
})

// Then, define your workflow.
// Workflows can be simple, or they can be more complex, involving multiple steps and loops.
const researchTripWorkflow = workflow({
  members: [activityPlanner, restaurantScout],
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
  // By default, framework does not log anything.
  // Use `logger` for nice console output of each step on the way.
  telemetry: logger,
})

// Finally, you can run the workflow.
// This will block until the workflow is completed.
const result = await teamwork(researchTripWorkflow)

// Don't forget to log the result!
console.log(result)
```

### Running the example

Finally, you can run the example by simply executing the file.

#### Using `bun`

```bash
$ bun your_file.ts
```

#### Using `node`

```bash
$ node --import=tsx your_file.ts
```

## Why Another AI Agent Framework?

Most existing AI agent frameworks are either too complex, heavily object-oriented, or tightly coupled to specific infrastructure. 

We wanted something different - a framework that embraces functional programming principles, remains stateless, and stays laser-focused on composability.

**Now, English + Typescript is your tech stack.**

## Core Concepts

The framework is designed around the idea that AI agents should be:
- Easy to create and compose
- Infrastructure-agnostic
- Stateless by default
- Minimal in dependencies
- Focused on team collaboration

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

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## Made with ❤️ at Callstack

Dead Simple AI Agent is an open source project and will always remain free to use. If you think it's cool, please star it 🌟. [Callstack](https://callstack.com) is a group of React and React Native geeks, contact us at [hello@callstack.com](mailto:hello@callstack.com) if you need any help with these or just want to say hi!

Like the project? ⚛️ [Join the team](https://callstack.com/careers/?utm_campaign=Senior_RN&utm_source=github&utm_medium=readme) who does amazing stuff for clients and drives React Native Open Source! 🔥 
