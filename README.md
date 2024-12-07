# Dead Simple AI Agent

A lightweight, functional, and composable framework for building AI agents that work together to solve complex tasks. Built with TypeScript and designed to be serverless-ready.

## Getting Started

```bash
npm install @dead-simple-ai-agent/framework
```

```typescript
import { agent, teamwork, workflow } from '@dead-simple-ai-agent/framework'

// Define specialized agents
const researcher = agent({
  role: 'Research Specialist',
  description: 'Expert at finding and analyzing technical information',
})

const writer = agent({
  role: 'Content Writer',
  description: 'Skilled at creating clear, engaging content',
})

// Create a workflow
const documentationWorkflow = workflow({
  members: [researcher, writer],
  description: `
    Get all AI agent frameworks from the Internet in TypeScript and create a comprehensive guide.
  `,
  output: 'Clear, comprehensive guide about each AI agent framework',
})

// Execute the workflow
const result = await teamwork(documentationWorkflow)
console.log(result)
```

Check out more [examples on GitHub](https://github.com/username/dead-simple-ai-agent/tree/main/examples), including:
- Product description generation
- Medical surveys
- Travel planning

## Why Another AI Agent Framework?

Most existing AI agent frameworks are either too complex, heavily object-oriented, or tightly coupled to specific infrastructure. We wanted something different - a framework that embraces functional programming principles, remains stateless, and stays laser-focused on composability.

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


