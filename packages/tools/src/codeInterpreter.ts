import { execSync } from 'child_process'
import { tool } from 'fabrice-ai/tool'
import fs from 'fs'
import { z } from 'zod'

type CodeInterpreterOptions = {
  name: string
  description: string
  defaultImageTag: string
  userDockerfilePath: string | null
  unsafeMode: boolean
}

const interpreterOptions: CodeInterpreterOptions = {
  name: 'Code Interpreter',
  description: 'Interprets Python3 code strings with a final print statement.',
  defaultImageTag: 'code-interpreter:latest',
  userDockerfilePath: null,
  unsafeMode: false,
}

/**
 * Helper function to run shell commands using execSync with consistent error/output handling.
 * Returns stdout on success, and a detailed error message (including stdout/stderr) on failure.
 */
function runCommand(
  command: string,
  options: { stdio?: any; encoding?: string } = { stdio: 'pipe', encoding: 'utf-8' }
): string {
  try {
    return execSync(command, options).toString()
  } catch (error: any) {
    const stdout = error.stdout ? error.stdout.toString() : ''
    const stderr = error.stderr ? error.stderr.toString() : ''
    return `Command failed: ${command}\nError: ${error.message}\nStdout: ${stdout}\nStderr: ${stderr}`
  }
}

const verifyDockerImage = (): string | void => {
  let output = runCommand(`docker image inspect ${interpreterOptions.defaultImageTag}`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  })

  if (output.startsWith('Command failed')) {
    // Need to build the image
    let dockerfilePath: string
    if (
      interpreterOptions.userDockerfilePath &&
      fs.existsSync(interpreterOptions.userDockerfilePath)
    ) {
      dockerfilePath = interpreterOptions.userDockerfilePath
    } else {
      dockerfilePath = process.cwd()
      if (!fs.existsSync(dockerfilePath)) {
        throw new Error(`Dockerfile not found in ${dockerfilePath}`)
      }
    }

    output = runCommand(`docker build -t ${interpreterOptions.defaultImageTag} ${dockerfilePath}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    if (output.startsWith('Command failed')) {
      throw new Error(output)
    }
  }

  // Remove existing container if it exists
  output = runCommand('docker rm -f code-interpreter', { stdio: 'pipe', encoding: 'utf-8' })
  // It's okay if it fails because the container might not exist, we won't throw here.

  // Create a new container that keeps running
  output = runCommand(
    `docker create --name code-interpreter -w /workspace -v ${process.cwd()}:/workspace ${interpreterOptions.defaultImageTag} tail -f /dev/null`,
    { stdio: 'pipe', encoding: 'utf-8' }
  )
  if (output.startsWith('Command failed')) {
    throw new Error(output)
  }
}

const initDockerContainer = (): void => {
  // Remove existing container if running
  const removeOutput = runCommand('docker rm -f code-interpreter', {
    stdio: 'pipe',
    encoding: 'utf-8',
  })
  // No need to throw, container might not exist

  // Create a new container that keeps running
  const createOutput = runCommand(
    `docker create --name code-interpreter -w /workspace -v ${process.cwd()}:/workspace ${interpreterOptions.defaultImageTag} tail -f /dev/null`,
    { stdio: 'pipe', encoding: 'utf-8' }
  )
  if (createOutput.startsWith('Command failed')) {
    throw new Error(createOutput)
  }
}

const runCodeInDocker = (code: string, librariesUsed: string[]): string => {
  const verifyOutput = verifyDockerImage()
  if (typeof verifyOutput === 'string' && verifyOutput.startsWith('Command failed')) {
    return verifyOutput
  }

  try {
    initDockerContainer()

    let output = runCommand('docker start code-interpreter', { stdio: 'pipe', encoding: 'utf-8' })
    if (output.startsWith('Command failed')) {
      return output
    }

    // Install required libraries
    for (const library of librariesUsed) {
      if (library) {
        output = runCommand(`docker exec code-interpreter pip install ${library}`, {
          stdio: 'pipe',
          encoding: 'utf-8',
        })
        if (output.startsWith('Command failed')) {
          return output
        }
      }
    }

    // Run the code
    const codeOutput = runCommand(
      `docker exec code-interpreter python3 -c "${code.replace(/"/g, '\\"')}"`,
      { stdio: 'pipe', encoding: 'utf-8' }
    )

    // Stop and remove the container
    runCommand('docker stop code-interpreter', { stdio: 'pipe', encoding: 'utf-8' })
    runCommand('docker rm code-interpreter', { stdio: 'pipe', encoding: 'utf-8' })

    return codeOutput
  } catch (error: any) {
    return `Unexpected error: ${error.message}`
  }
}

const runCodeUnsafe = (code: string, librariesUsed: string[]): string => {
  for (const library of librariesUsed) {
    const output = runCommand(`pip install ${library}`, { stdio: 'pipe', encoding: 'utf-8' })
    if (output.startsWith('Command failed')) {
      return output
    }
  }

  try {
    const result = eval(code)
    return result ? result.toString() : 'No result variable found.'
  } catch (error: any) {
    return `An error occurred during evaluation: ${error.message}`
  }
}

const runCode = async (args: { code?: string; librariesUsed?: string[] }): Promise<string> => {
  const code = args.code || ''
  const librariesUsed = args.librariesUsed || []

  if (interpreterOptions.unsafeMode) {
    return runCodeUnsafe(code, librariesUsed)
  } else {
    return runCodeInDocker(code, librariesUsed)
  }
}

export const codeInterpreter = tool({
  description: 'Interprets Python3 code strings with a final print statement.',
  parameters: z.object({
    code: z.string().describe('Python3 code to be interpreted.'),
    librariesUsed: z
      .array(z.string())
      .describe('Python3 non built-in libraries used in the code, to be installed using"pip"'),
  }),
  execute: ({ code, librariesUsed }) => {
    if (!code) {
      throw new Error('Python3 code is required.')
    }
    return runCode({ code, librariesUsed })
  },
})
