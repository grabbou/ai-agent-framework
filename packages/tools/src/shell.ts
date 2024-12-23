import { execSync } from 'child_process'
import { tool } from 'fabrice-ai/tool'
import fs from 'fs'
import { z } from 'zod'

// You can reuse or rename these options depending on your needs.
type ShellToolOptions = {
  name: string
  description: string
  defaultImageTag: string
  userDockerfilePath: string | null
}

// Default options for your shell tool
const shellToolOptions: ShellToolOptions = {
  name: 'Shell Tool',
  description: 'Executes arbitrary shell commands inside a Docker container.',
  defaultImageTag: 'shell-tool:latest',
  userDockerfilePath: null,
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

/**
 * Verifies (and if needed, builds) the Docker image. Then creates an (initially stopped) container.
 */
function verifyDockerImageAndContainer(storagePath: string) {
  // Step 1: Check if image is present
  let output = runCommand(`docker image inspect ${shellToolOptions.defaultImageTag}`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  })

  // Step 2: If not present, try to build
  if (output.startsWith('Command failed')) {
    let dockerfilePath: string
    if (shellToolOptions.userDockerfilePath && fs.existsSync(shellToolOptions.userDockerfilePath)) {
      // Use user-provided Dockerfile
      dockerfilePath = shellToolOptions.userDockerfilePath
    } else {
      // Otherwise assume there's a Dockerfile in the current directory
      dockerfilePath = process.cwd()
      if (!fs.existsSync(dockerfilePath)) {
        throw new Error(`Dockerfile not found in ${dockerfilePath}`)
      }
    }

    output = runCommand(`docker build -t ${shellToolOptions.defaultImageTag} ${dockerfilePath}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    if (output.startsWith('Command failed')) {
      throw new Error(output)
    }
  }

  // Step 3: Remove existing container if it exists (ignore failures)
  runCommand('docker rm -f shell-runner', { stdio: 'pipe', encoding: 'utf-8' })

  // Step 4: Create a new container (stopped) that we will start/exec into
  output = runCommand(
    `docker create --name shell-runner -w /${storagePath} -v ${process.cwd()}:/${storagePath} ` +
      `${shellToolOptions.defaultImageTag} tail -f /dev/null`,
    { stdio: 'pipe', encoding: 'utf-8' }
  )
  if (output.startsWith('Command failed')) {
    throw new Error(output)
  }
}

/**
 * Start the container if it is stopped or not started yet.
 */
function startContainer() {
  const output = runCommand('docker start shell-runner', { stdio: 'pipe', encoding: 'utf-8' })
  if (output.startsWith('Command failed')) {
    throw new Error(output)
  }
}

/**
 * Runs the given shell command inside the container, returning stdout or error info.
 */
function runShellInDocker(command: string): string {
  return runCommand(`docker exec shell-runner sh -c "${command.replace(/"/g, '\\"')}"`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  })
}

/**
 * Cleanup function to stop and remove the container.
 */
function cleanupContainer() {
  runCommand('docker stop shell-runner', { stdio: 'pipe', encoding: 'utf-8' })
  runCommand('docker rm shell-runner', { stdio: 'pipe', encoding: 'utf-8' })
}

/**
 * The core function that orchestrates the "verify or build image" + "run command" + "cleanup".
 */
async function runShellCommand(args: { command: string; storagePath: string }): Promise<string> {
  const { command, storagePath } = args

  try {
    // Ensure Docker image is present and container is created
    verifyDockerImageAndContainer(storagePath)
    // Start container if not running
    startContainer()

    // Execute the command in container
    const output = runShellInDocker(command)

    // Finally, stop & remove container
    cleanupContainer()

    return output
  } catch (error: any) {
    // Attempt cleanup if anything goes wrong
    cleanupContainer()
    return `Unexpected error: ${error.message}`
  }
}

/**
 * Exported shellTool, which runs arbitrary shell commands in a container
 * and allows configuring the container-mounted path (default "workspace").
 */

interface ShellOptions {
  workingDir: string
}

export const createShellTools = ({ workingDir }: ShellOptions) => {
  return {
    shellExec: tool({
      description:
        'Executes a shell command inside a Docker container. Storage path is configurable.',
      parameters: z.object({
        command: z.string().describe('The shell command to run inside the container.'),
      }),
      execute: async ({ command }) => {
        if (!command) {
          throw new Error('A shell command is required.')
        }
        return runShellCommand({ command, storagePath: workingDir })
      },
    }),
  }
}
