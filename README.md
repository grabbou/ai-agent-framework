<p>
  <img src="https://github.com/user-attachments/assets/bd03d003-9c22-4154-8953-519a5faabaa6" height="250" />
</p>

A lightweight, functional, and composable framework for building AI agents that work together to solve complex tasks. 

Built with TypeScript and designed to be serverless-ready.

## Table of Contents

- [Getting Started](#getting-started)
  - [Using create-fabrice-ai](#using-create-fabrice-ai)
  - [Manual Installation](#manual-installation) 
- [Why Another AI Agent Framework?](#why-another-ai-agent-framework)
- [Core Concepts](#core-concepts)
  - [Easy to create and compose](#easy-to-create-and-compose)
  - [Infrastructure-agnostic](#infrastructure-agnostic)
  - [Stateless](#stateless)
  - [Batteries included](#batteries-included)
- [Agents](#agents)
  - [Creating Custom Agents](#creating-custom-agents)
  - [Built-in Agents](#built-in-agents)
  - [Replacing Built-in Agents](#replacing-built-in-agents)
- [Workflows](#workflows)
- [Workflow States](#workflow-states)
  - [Root State](#root-state) 
  - [Child State](#child-state)
  - [Delegating Tasks](#delegating-tasks)
  - [Handing off Tasks](#handing-off-tasks)
- [Providers](#providers)
  - [Built-in Providers](#built-in-providers)
  - [Using Different Providers](#using-different-providers)
  - [Creating Custom Providers](#creating-custom-providers)
- [Tools](#tools)
  - [Built-in Tools](#built-in-tools)
  - [Creating Custom Tools](#creating-custom-tools)
  - [Using Tools](#using-tools)
- [Execution](#execution)
  - [Completing the workflow](#completing-the-workflow)
  - [Long-running operations](#long-running-operations)
  - [Custom execution](#custom-execution)
- [Test framework](./packages/bdd/README.md)
- [Contributors](#contributors)
- [Made with ❤️ at Callstack](#made-with-❤️-at-callstack)

## Getting Started

It is very easy to get started. All you have to do is to create a file with your agents and workflow, then run it.

### Using `npx create-fabrice-ai`

Use our creator tool to quickly create a new AI agent project.

```bash
npx create-fabrice-ai
```

You can choose from a few templates. You can see a full list of them [here](./example/README.md).

### Manually

```bash
npm install fabrice-ai
```

#### Create your first workflow

Here is a simple example of a workflow that researches and plans a trip to Wrocław, Poland:

```ts
import { agent } from 'fabrice-ai/agent'
import { teamwork } from 'fabrice-ai/teamwork'
import { solution, workflow } from 'fabrice-ai/workflow'

import { lookupWikipedia } from './tools/wikipedia.js'

const activityPlanner = agent({
  description: `You are skilled at creating personalized itineraries...`,
})

const landmarkScout = agent({
  description: `You research interesting landmarks...`,
  tools: { lookupWikipedia },
})

const workflow = workflow({
  team: { activityPlanner, landmarkScout },
  description: `Plan a trip to Wrocław, Poland...`,
})

const result = await teamwork(workflow)
console.log(solution(result))
```

#### Running the example

Finally, you can run the example by simply executing the file.

**Using `bun`**

```bash
bun your_file.ts
```

**Using `node`**

```bash
node --import=tsx your_file.ts
```

## Why Another AI Agent Framework?

Most existing AI agent frameworks are either too complex, heavily object-oriented, or tightly coupled to specific infrastructure. 

We wanted something different - a framework that embraces functional programming principles, remains stateless, and stays laser-focused on composability.

**Now, English + Typescript is your tech stack.**

## Core Concepts

Here are the core concepts of Fabrice:

### Easy to create and compose

Teamwork should be easy and fun, just like in real life. It should not require you to learn a new framework and mental model to put your AI team together.

### Infrastructure-agnostic

There should be no assumptions about the infrastructure you're using. You should be able to use any provider and any tools, in any environment.

### Stateless

No classes, no side effects. Every operation should be a function that returns a new state.

### Batteries included

We should provide you with all tools and features needed to build your AI team, locally and in the cloud.

## Agents

Agents are specialized workers with specific roles and capabilities. Agents can call available tools and complete assigned tasks. Depending on the task complexity, it can be done in a single step, or multiple steps.

### Creating Custom Agents

To create a custom agent, you can use our `agent` helper function or implement the `Agent` interface manually.

```ts
import { agent } from 'fabrice-ai/agent'

const myAgent = agent({
  role: '<< your role >>',
  description: '<< your description >>',
})
```

Additionally, you can give it access to tools by passing a `tools` property to the agent. You can learn more about tools [here](#tools). You can also set custom `provider` for each agent. You can learn more about providers [here](#providers).

### Built-in Agents

Fabrice comes with a few built-in agents that help it run your workflows out of the box.

Supervisor, `supervisor`, is responsible for coordinating the workflow. 
It splits your workflow into smaller, more manageable parts, and coordinates the execution.

Resource Planner, `resourcePlanner`, is responsible for assigning tasks to available agents, based on their capabilities.

Final Boss, `finalBoss`, is responsible for wrapping up the workflow and providing a final output,
in case total number of iterations exeeceds available threshold.

### Replacing Built-in Agents

You can overwrite built-in agents by setting it in the workflow.

For example, to replace built-in `supervisor` agent, you can do it like this:

```ts
import { supervisor } from './my-supervisor.js'

workflow({
  team: { supervisor },
})
```

## Workflows

Workflows define how agents collaborate to achieve a goal. They specify:
- Team members
- Task description
- Expected output
- Optional configuration

## Workflow State

Workflow state is a representation of the current state of the workflow. It is a tree of states, where each state represents a single agent's work. 

At each level, we have the following properties:
- `agent`: name of the agent that is working on the task
- `status`: status of the agent
- `messages`: message history
- `children`: child states

First element of the `messages` array is always a request to the agent, typically a user message. Everything that follows is a message history, including all the messages exchanged with the provider.

Workflow can have multiple states:
- `idle`: no work has been started yet
- `running`: work is in progress
- `paused`: work is paused and there are tools that must be called to resume
- `finished`: work is complete
- `failed`: work has failed due to an error

### Initial State

When you run `teamwork(workflow)`, initial state is automatically created for you by calling `rootState(workflow)` behind the scenes. 

> [!NOTE]
> You can also provide your own initial state (for example, to resume a workflow from a previous state). You can learn more about it in the [server-side usage](#server-side-usage) section.

### Root State

Root state is a special state that contains an initial request based on the workflow and points to the `supervisor` agent, which is responsible for splitting the work into smaller, more manageable parts. 

You can learn more about the `supervisor` agent [here](#built-in-agents).

### Child State

Child state is like root state, but it points to any agent, such as one from your team. 

You can create it manually, or use `childState` function.

```ts
const child = childState({
  agent: '<< agent name >>',
  messages: user('<< task description >>'),
})
```

> [!TIP]
> Fabrice exposes a few helpers to facilitate creating messages, such as `user` and `assistant`. You can use them to create messages in a more readable way, although it is not required.

### Delegating Tasks

To delegate the task, just add a new child state to your agent's state.

```ts
const state = {
  ...state,
  children: [
    ...state.children,
    childState({
      /** agent to work on the task */
      agent: '<< agent name >>',
      /** task description */
      messages: [
        {
          role: 'user',
          content: '<< task description >>',
        }
      ],
    })
  ]
}
```

To make it easier, you can use `delegate` function to delegate the task.

```ts
const state = delegate(state, [agent, '<< task description >>'])
```

### Handing off Tasks

To hand off the task, you can replace your agent's state with a new state, that points to a different agent.

```ts
const state = childState({
  agent: '<< new agent name >>',
  messages: state.messages,
})
```

In the example above, we're passing the entire message history to the new agent, including the original request and all the work done by any previous agent. It is up to you to decide how much of the history to pass to the new agent.

## Providers

Providers are responsible for sending requests to the LLM and handling the responses.

### Built-in Providers

Fabrice comes with a few built-in providers:
- OpenAI (structured output)
- OpenAI (using tools as response format)
- Groq

You can learn more about them [here](./packages/framework/src/providers/README.md).

If you're working with an OpenAI compatible provider, you can use the `openai` provider with a different base URL and API key, such as:

```ts
openai({
  model: '<< your model >>',
  options: {
    apiKey: '<< your_api_key >>',
    baseURL: '<< your_base_url >>',
  },
})
```

### Using Different Providers

By default, Fabrice uses OpenAI gpt-4o model. You can change the default model or provider either for the entire system, or for specific agent.

To do it for the entire workflow:
```ts
import { grok } from 'fabrice-ai/providers/grok'

workflow({
  /** other options go here */
  provider: grok()
})
```

To change it for specific agent:

```ts
import { grok } from 'fabrice-ai/providers/grok'

agent({
  /** other options go here */
  provider: grok()
})
```

Note that an agent's provider always takes precedence over a workflow's provider. Tools always receive the provider from the agent that triggered their execution.

### Creating Custom Providers

To create a custom provider, you need to implement the `Provider` interface. 

```ts
const myProvider = (options: ProviderOptions): Provider => {
  return {
    chat: async () => {
      /** your implementation goes here */
    },
  }
}
```

You can learn more about the `Provider` interface [here](./packages/framework/src/models.ts).

## Tools

Tools extend agent capabilities by providing concrete actions they can perform.

### Built-in Tools

Fabrice comes with a few built-in tools via `@fabrice-ai/tools` package. For most up-to-date list, please refer to the [README](./packages/tools/README.md).

### Creating Custom Tools

To create a custom tool, you can use our `tool` helper function or implement the `Tool` interface manually.

```ts
import { tool } from 'fabrice-ai/tools'

const myTool = tool({
  description: 'My tool description',
  parameters: z.object({
    /** your Zod schema goes here */
  }),
  execute: async (parameters, context) => {
    /** your implementation goes here */
  },
})
```

Tools will use the same provider as the agent that triggered them. Additionally, you can access the `context` object, which gives you access to the provider, as well as current message history.

### Using Tools

To give an agent access to a tool, you need to add it to the agent's `tools` property.

```ts
agent({
  role: '<< your role >>',
  tools: { searchWikipedia },
})
```

Since tools are passed to an LLM and referred by their key, you should use meaningful names for them, for increased effectiveness.

## Execution

Execution is the process of running the workflow to completion. A completed workflow is a workflow with state "finished" at its root. 

### Completing the workflow

The easiest way to complete the workflow is to call `teamwork(workflow)` function. It will run the workflow to completion and return the final state.

```ts
const state = await teamwork(workflow)
console.log(solution(state))
```

Calling `solution(state)` will return the final output of the workflow, which is its last message.

### Long-running operations

If you are running workflows in the cloud, or any other environment where you want to handle tool execution manually, you can call teamwork the following way:

```ts
/** read state from the cache */

/** run the workflow */
const state = await teamwork(workflow, prevState, false)

/** save state to the cache */
```

Passing second argument to `teamwork` is optional. If you don't provide it, root state will be created automatically. Otherwise, it will be used as a starting point for the next iteration.

Last argument is a boolean flag that determines if tools should be executed. If you set it to `false`, you are responsible for calling tools manually. Teamwork will stop iterating over the workflow and return the current state with `paused` status.

### Custom execution

If you want to handle tool execution manually, you can use `iterate` function to build up your own recursive iteration logic over the workflow state.

Have a look at how `teamwork` is implemented [here](./packages/framework/src/teamwork.ts) to understand how it works.


### BDD Testing

There's a packaged called `fabrice-ai/bdd` dedicated to unit testing - actually to Behavioral Driven Development. [Check the docs](./packages/bdd/README.md).

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START -->
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
