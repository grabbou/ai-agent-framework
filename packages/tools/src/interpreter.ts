import { execSync } from 'child_process' // still needed for local "unsafeMode" calls
import { openai } from 'fabrice-ai/providers/openai'
import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

import { createShellTools } from './shell.js' // <-- import your shell tool

type CodeInterpreterOptions = {
  name: string
  description: string
  defaultImageTag: string
  userDockerfilePath: string | null
  unsafeMode: boolean
}

/**
 * In Docker mode, we now reuse the shellTool for Docker commands
 */
const { shellExec /*, cleanupShellRunner */ } = createShellTools({
  workingDir: process.cwd(),
  mountPointDir: 'workspace',
  // Example of setting your code-interpreter options
  dockerOptions: (CodeInterpreterOptions = {
    name: 'Code Interpreter',
    description: 'Interprets Python3 code strings with a final print statement.',
    defaultImageTag: 'code-interpreter:latest',
    userDockerfilePath: null,
    unsafeMode: false,
  }),
})

/**
 * Runs code in Docker by installing needed libraries and then executing Python code.
 * Uses the shellTool's shellExec instead of duplicating Docker logic.
 */
async function runCodeInDocker(code: string, librariesUsed: string[]): Promise<string> {
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
    const codeOutput = await shellExec.execute({ command: codeCommand })

    return codeOutput
  } catch (error: any) {
    return `Unexpected error: ${error.message}`
  }
}

/**
 * "Unsafe" local mode: runs pip install locally and then eval() the code.
 * You can adapt this to your needs. This is synchronous for illustration.
 */
function runCodeUnsafe(code: string, librariesUsed: string[]): string {
  // Install libraries locally
  for (const library of librariesUsed) {
    if (library) {
      try {
        const output = execSync(`pip install ${library}`, { stdio: 'pipe', encoding: 'utf-8' })
        // Just for demonstration, you could do checks
        if (output.includes('ERROR')) {
          return output
        }
      } catch (err: any) {
        return `Command failed: pip install ${library}\nError: ${err.message}`
      }
    }
  }

  // Evaluate code locally (WARNING: dangerous)
  try {
    const result = eval(code)
    return result ? result.toString() : 'No result variable found.'
  } catch (error: any) {
    return `An error occurred during evaluation: ${error.message}`
  }
}

/**
 * Orchestrate choosing between Docker-based or local unsafe mode.
 */
async function runCode(args: { code?: string; librariesUsed?: string[] }): Promise<string> {
  const code = args.code || ''
  const librariesUsed = args.librariesUsed || []

  if (interpreterOptions.unsafeMode) {
    return runCodeUnsafe(code, librariesUsed)
  } else {
    return runCodeInDocker(code, librariesUsed)
  }
}

/**
 * Finally, export a "codeInterpreter" tool that other code can use.
 */
export const codeInterpreter = tool({
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
    return runCode({ code, librariesUsed })
  },
})
