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
- [Agents](#agents)
  - [Creating Custom Agents](#creating-custom-agents)
  - [Built-in Agents](#built-in-agents)
  - [Replacing Built-in Agents](#replacing-built-in-agents)
- [Workflows](#workflows)
- [Workflow States](#workflow-states)
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
  - [Running Workflows](#running-workflows)
  - [Long-running Operations](#long-running-operations)
- [Examples](#examples)
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

The framework is designed around the idea that AI agents should be:
- Easy to create and compose
- Infrastructure-agnostic
- Stateless by default
- Minimal in dependencies
- Focused on team collaboration

[TBD]

## Agents

Agents are specialized workers with specific roles and capabilities. Agents can call available tools and complete assigned tasks. Depending on the task complexity, it can be done in a single step, or multiple steps.

### Creating Custom Agents

To create a custom agent, you need to implement the `Agent` interface. You can either do it manually, or use our `agent` helper function to enforce type checking.

```ts
import { agent } from 'fabrice-ai/agent'

const myAgent = agent({
  role: '<< your role >>',
  description: '<< your description >>',
})
```

Additionally, you can pass `tools` property to the agent, which will give it access to the tools. You can learn more about tools [here](#tools). You can also set custom `provider` for each agent. You can learn more about providers [here](#providers).

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

## Workflow States

[TBD]

### Delegating Tasks

[TBD]

### Handing off Tasks

[TBD]

## Providers

Providers are responsible for sending requests to the LLM and handling the responses.

### Built-in Providers

Fabrice comes with a few built-in providers:
- OpenAI (structured output)
- OpenAI (using tools as response format)
- Groq

You can learn more about them [here](./packages/framework/src/providers/README.md).

If you're working with OpenAI compatible provider, you can use `openai` provider with different base URL and API key, such as:

```ts
openai({
  model: '<< your model >>',
  strictMode: false,
  options: {
    apiKey: '<< your_api_key >>',
    baseURL: '<< your_base_url >>',
  },
})
```

### Using Different Providers

By default, Fabrice uses OpenAI gpt-4o model. You can change the default model either for the entire system, or for specific agent.

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

Note that agent provider always takes precedence over workflow provider. Tools always receive provider from the agent that triggered their execution.

### Creating Custom Providers

To create a custom provider, you need to implement the `Provider` interface. 

```ts
const myProvider = (options: ProviderOptions): Provider => {
  return {
    chat: async (options) => {
      /** your implementation goes here */
    },
    embeddings: async (options) => {
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

To create a custom tool, you need to implement the `Tool` interface. You can either do it manually, or use our `tool` helper function to enforce type checking.

```ts
import { tool } from 'fabrice-ai/tools'

const myTool = tool({
  description: 'My tool description',
  parameters: z.object({
    /** your Zod schema goes here */
  }),
  execute: async (params, context) => {
    /** your implementation goes here */
  },
})
```

Tools will use the same provider as the agent that triggered them. Additionally, you can access `context` object, which gives you accces to the provider, as well as current message history.

### Using Tools

To give an agent access to a tool, you need to add it to the agent's `tools` property.

```ts
agent({
  role: '<< your role >>',
  tools: { searchWikipedia },
})
```

Since tools are passed to an LLM and referred by their key, you should use meaningful names for them, for increased effectiveness.

## Server-side Usage

### Serverless Deployment
TBD

### Long-running Operations
TBD

## Examples
TBD

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
