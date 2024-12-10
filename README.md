<p>
  <img src="https://github.com/user-attachments/assets/bd03d003-9c22-4154-8953-519a5faabaa6" height="250" />
</p>

A lightweight, functional, and composable framework for building AI agents that work together to solve complex tasks. 

Built with TypeScript and designed to be serverless-ready.

## Getting Started

It is very easy to get started. All you have to do is to create a file with your agents and workflow, then run it.

### Using `npx create-fabrice-ai`

Use our creator tool to quickly create a new AI agent project.

```bash
$ npx create-fabrice-ai
```

You can choose from a few templates. You can see a full list of them [here](./example/README.md).

### Manually

```bash
$ npm install fabrice-ai
```

#### Create your first workflow

Here is a simple example of a workflow that researches and plans a trip to Wrocław, Poland:

```ts
import { agent } from 'fabrice-ai/agent'
import { teamwork } from 'fabrice-ai/teamwork'
import { solution, workflow } from 'fabrice-ai/workflow'

import { lookupWikipedia } from './tools/wikipedia.js'

const activityPlanner = agent({
  role: 'Activity Planner',
  description: `You are skilled at creating personalized itineraries...`,
})

const landmarkScout = agent({
  role: 'Landmark Scout',
  description: `You research interesting landmarks...`,
  tools: { lookupWikipedia },
})

const workflow = workflow({
  members: [activityPlanner, landmarkScout],
  description: `Plan a trip to Wrocław, Poland...`,
})

const result = await teamwork(workflow)
console.log(solution(result))
```

#### Running the example

Finally, you can run the example by simply executing the file.

**Using `bun`**

```bash
$ bun your_file.ts
```

**Using `node`**

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
import { teamwork } from 'fabrice'

const state = await teamwork(workflow)
```

#### Server-side Teamwork

The server-side version of teamwork is perfectly suited for long-running workflows that require external tool execution or manual intervention. It will not wait for the tool to be executed, but will return the state of the workflow.

You can then handle tool calls on your own, and call `teamwork` again when ready.

```typescript
import { teamwork } from 'fabrice-ai/server'

// If status is `assigned`, you need to handle tool calls on your own.
// Otherwise, status is `finished` and you can read the result.
const nextState = await teamwork(workflow)
```

This pattern is especially useful for:
- Running workflows in serverless environments
- Handling long-running tool executions
- Implementing manual review steps
- Building interactive workflows
- Managing rate limits and quotas

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
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/grabbou"><img src="https://avatars.githubusercontent.com/u/2464966?v=4?s=100" width="100px;" alt="Mike"/><br /><sub><b>Mike</b></sub></a><br /><a href="#code-grabbou" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://catchthetornado.com"><img src="https://avatars.githubusercontent.com/u/211899?v=4?s=100" width="100px;" alt="Piotr Karwatka"/><br /><sub><b>Piotr Karwatka</b></sub></a><br /><a href="#code-pkarw" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## Made with ❤️ at Callstack

Fabrice is an open source project and will always remain free to use. If you think it's cool, please star it 🌟. [Callstack](https://callstack.com) is a group of React and React Native geeks, contact us at [hello@callstack.com](mailto:hello@callstack.com) if you need any help with these or just want to say hi!

Like the project? ⚛️ [Join the team](https://callstack.com/careers/?utm_campaign=Senior_RN&utm_source=github&utm_medium=readme) who does amazing stuff for clients and drives React Native Open Source! 🔥 
