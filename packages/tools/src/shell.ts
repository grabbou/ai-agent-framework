import { execSync } from 'child_process'
import { tool } from 'fabrice-ai/tool'
import fs from 'fs'
import * as path from 'path'
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
 * Check if an image by shellToolOptions.defaultImageTag is present.
 * If not, build it.
 */
function verifyOrBuildDockerImage() {
  let output = runCommand(`docker image inspect ${shellToolOptions.defaultImageTag}`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  })

  // If image not found, try to build it
  if (output.startsWith('Command failed')) {
    let dockerfilePath: string

    if (shellToolOptions.userDockerfilePath && fs.existsSync(shellToolOptions.userDockerfilePath)) {
      dockerfilePath = shellToolOptions.userDockerfilePath
    } else {
      // Otherwise assume there's a Dockerfile in the current directory or a subfolder
      dockerfilePath = path.resolve(import.meta.dirname, 'shell')
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
}

/**
 * Check if the "shell-runner" container exists. If not, create it.
 * Does NOT start or remove the container.
 */
function verifyOrCreateContainer(storagePath: string, storageMountPoint: string) {
  // Check if container exists
  let output = runCommand(`docker inspect shell-runner`, { stdio: 'pipe', encoding: 'utf-8' })

  // If container does not exist, create it
  if (output.startsWith('Command failed')) {
    output = runCommand(
      `docker create --name shell-runner -w /${storageMountPoint} ` +
        `-v ${storagePath}:/${storageMountPoint} ` +
        `${shellToolOptions.defaultImageTag} tail -f /dev/null`,
      { stdio: 'pipe', encoding: 'utf-8' }
    )
    if (output.startsWith('Command failed')) {
      throw new Error(output)
    }
  }
}

/**
 * Start the container if it is stopped.
 */
function startContainer() {
  // Check container status
  const inspectOutput = runCommand(`docker inspect -f '{{.State.Running}}' shell-runner`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  })

  // If container is not running, start it
  if (inspectOutput.trim() !== 'true') {
    const output = runCommand('docker start shell-runner', { stdio: 'pipe', encoding: 'utf-8' })
    if (output.startsWith('Command failed')) {
      throw new Error(output)
    }
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
 * Optional cleanup function to stop and remove the container.
 * Call this manually if you want to remove the container from the system.
 */
export function cleanupContainer() {
  runCommand('docker stop shell-runner', { stdio: 'pipe', encoding: 'utf-8' })
  runCommand('docker rm shell-runner', { stdio: 'pipe', encoding: 'utf-8' })
}

/**
 * The core function that orchestrates "verify/build image" + "create container if needed" + "start container if stopped" + "run command".
 * Note: We do NOT clean up the container automatically, so we can reuse it for subsequent commands.
 */
async function runShellCommand(args: {
  command: string
  storagePath: string
  storageMountPoint: string
}): Promise<string> {
  const { command, storagePath, storageMountPoint } = args

  try {
    // Ensure Docker image is built
    verifyOrBuildDockerImage()

    // Ensure container is created (if needed)
    verifyOrCreateContainer(storagePath, storageMountPoint)

    // Start container if not running
    startContainer()

    // Execute the command in container
    const output = runShellInDocker(command)
    return output
  } catch (error: any) {
    return `Unexpected error: ${error.message}`
  }
}

/**
 * Exported shellTool, which runs arbitrary shell commands in a container
 * and allows configuring the container-mounted path (default "workspace").
 */

interface ShellOptions {
  workingDir: string
  mountPointDir: string
}

export const createShellTools = ({ workingDir, mountPointDir }: ShellOptions) => {
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

        // Default if not provided
        if (!mountPointDir) mountPointDir = 'mnt'
        // Remove leading/trailing slash from mountPointDir
        mountPointDir = mountPointDir.replace(/^\/|\/$/g, '')

        return runShellCommand({
          command,
          storagePath: workingDir,
          storageMountPoint: mountPointDir,
        })
      },
    }),
    // Optionally export a cleanup tool if you want to manually remove the container
    cleanupShellRunner: tool({
      description: 'Stops and removes the "shell-runner" container if it exists.',
      parameters: z.object({}),
      execute: async () => {
        cleanupContainer()
        return 'Container shell-runner has been stopped and removed.'
      },
    }),
  }
}
