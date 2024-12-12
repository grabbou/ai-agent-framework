// import { iterate } from './iterate.js'
// import { teamwork as originalTeamwork } from './teamwork.js'
// import { workflowState } from './workflow.js'

// /**
//  * Like teamwork(), but pauses when a task is assigned with tool to let the agent work independently.
//  */
// export const teamwork: typeof originalTeamwork = async (
//   workflow,
//   state = workflowState(workflow)
// ) => {
//   if (
//     state.status === 'finished' ||
//     (state.status === 'assigned' && state.agentStatus === 'tool')
//   ) {
//     return state
//   }

//   return teamwork(workflow, await iterate(workflow, state))
// }
