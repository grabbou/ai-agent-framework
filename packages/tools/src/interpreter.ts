import { openai } from 'fabrice-ai/providers/openai'
import { Tool, tool } from 'fabrice-ai/tool'
import { z } from 'zod'

import { createShellTools, ShellOptions } from './shell.js' // <-- import your shell tool

/**
 * Runs code in Docker by installing needed libraries and then executing Python code.
 * Uses the shellTool's shellExec instead of duplicating Docker logic.
 */
async function runCodeInDocker(
  shellExec: Tool,
  code: string,
  librariesUsed: string[]
): Promise<string> {
  try {
    // Install required libraries via pip
    for (const library of librariesUsed) {
      if (library) {
        const installOutput = await shellExec.execute(
          {
            command: `pip install ${library}`,
          },
          { provider: openai(), messages: [] }
        )

        // If there's an error string from shellExec, handle it
        if (installOutput.startsWith('Command failed')) {
          return installOutput
        }
      }
    }

    // Now run the Python code.
    const codeCommand = `python3 -c "${code.replace(/"/g, '\\"')}"`
    const codeOutput = await shellExec.execute(
      { command: codeCommand, escapeCommand: false }, // to avoid double escaped arguments
      {
        provider: openai(),
        messages: [],
      }
    )

    return codeOutput
  } catch (error: any) {
    return `Unexpected error: ${error.message}`
  }
}

/**
 * Orchestrate choosing between Docker-based or local unsafe mode.
 */
async function runCode(args: {
  shellExec: Tool
  code?: string
  librariesUsed?: string[]
}): Promise<string> {
  const code = args.code || ''
  const librariesUsed = args.librariesUsed || []
  return runCodeInDocker(args.shellExec, code, librariesUsed)
}

/**
 * Finally, export a "codeInterpreter" tool that other code can use.
 */

export const createCodeInterpreter = ({
  workingDir,
  mountPointDir,
  dockerOptions,
}: ShellOptions) => {
  /**
   * In Docker mode, we now reuse the shellTool for Docker commands
   * TODO: in the future add options for different code interpreters, not limited to Python
   */
  const { shellExec, cleanupDockerRunner } = createShellTools({
    workingDir,
    mountPointDir,
    dockerOptions: {
      ...dockerOptions,
      name: 'interpreter-docker',
    },
    escapeCommand: false, // to avoid double escape - we need to escape Python code first
  })

  return {
    cleanupDockerRunner,
    codeInterpreter: tool({
      description: 'Interprets Python3 code strings with a final print statement.',
      parameters: z.object({
        code: z.string().describe('Python3 code to be interpreted.'),
        librariesUsed: z
          .array(z.string())
          .describe('Python3 non built-in libraries used in the code, to be installed using "pip"'),
      }),
      execute: async ({ code, librariesUsed }) => {
        if (!code) {
          throw new Error('Python3 code is required.')
        }
        return runCode({ shellExec, code, librariesUsed })
      },
    }),
  }
}
