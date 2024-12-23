import { execSync } from 'child_process'
import { tool } from 'fabrice-ai/tool'
import fs from 'fs'
import * as path from 'path'
import { z } from 'zod'

// You can reuse or rename these options depending on your needs.
type DockerOptions = {
  name?: string
  defaultImageTag?: string
  userDockerfilePath?: string | null
}

/**
 * Helper function to run shell commands using execSync with consistent error/output handling.
 * Returns stdout on success, and a detailed error message (including stdout/stderr) on failure.
 */
function runCommand(
  command: string,
  options: { stdio?: any; encoding?: BufferEncoding } = { stdio: 'pipe', encoding: 'utf-8' }
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
function verifyOrBuildDockerImage(dockerContext: DockerOptions) {
  let output = runCommand(`docker image inspect ${dockerContext.defaultImageTag}`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  })

  // If image not found, try to build it
  if (output.startsWith('Command failed')) {
    let dockerfilePath: string

    if (dockerContext.userDockerfilePath && fs.existsSync(dockerContext.userDockerfilePath)) {
      dockerfilePath = dockerContext.userDockerfilePath
    } else {
      // Otherwise assume there's a Dockerfile in the current directory or a subfolder
      // @ts-ignore
      dockerfilePath = path.resolve(import.meta.dirname, dockerContext.name ?? 'shell')
      if (!fs.existsSync(dockerfilePath)) {
        throw new Error(`Dockerfile not found in ${dockerfilePath}`)
      }
    }

    output = runCommand(`docker build -t ${dockerContext.defaultImageTag} ${dockerfilePath}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    if (output.startsWith('Command failed')) {
      throw new Error(output)
    }
  }
}

/**
 * Check if the container exists. If not, create it.
 * Does NOT start or remove the container.
 */
function verifyOrCreateContainer(
  dockerContext: DockerOptions,
  storagePath: string,
  storageMountPoint: string
) {
  // Check if container exists
  let output = runCommand(`docker container inspect ${dockerContext.name}`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  })

  // If container does not exist, create it
  if (output.startsWith('Command failed')) {
    output = runCommand(
      `docker create --name ${dockerContext.name} -w /${storageMountPoint} ` +
        `-v ${storagePath}:/${storageMountPoint} ` +
        `${dockerContext.defaultImageTag} tail -f /dev/null`,
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
function startContainer(dockerContext: DockerOptions) {
  // Check container status
  const inspectOutput = runCommand(`docker inspect -f '{{.State.Running}}' ${dockerContext.name}`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  })
  // If container is not running, start it
  if (inspectOutput.trim() !== 'true') {
    const output = runCommand(`docker start ${dockerContext.name}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    if (output.startsWith('Command failed')) {
      throw new Error(output)
    }
  }
}

/**
 * Runs the given shell command inside the container, returning stdout or error info.
 */
function runShellInDocker(
  dockerContext: DockerOptions,
  command: string,
  escapeCommand: boolean
): string {
  const commandToExecute = escapeCommand
    ? `docker exec ${dockerContext.name} sh -c "${command.replace(/"/g, '\\"')}"`
    : `docker exec ${dockerContext.name} sh -c ${command}`

  return runCommand(command, {
    stdio: 'pipe',
    encoding: 'utf-8',
  })
}

/**
 * Optional cleanup function to stop and remove the container.
 * Call this manually if you want to remove the container from the system.
 */
export function cleanupContainer(dockerContext: DockerOptions) {
  runCommand(`docker stop ${dockerContext.name}`, { stdio: 'pipe', encoding: 'utf-8' })
  runCommand(`docker rm ${dockerContext.name}`, { stdio: 'pipe', encoding: 'utf-8' })
}

/**
 * The core function that orchestrates "verify/build image" + "create container if needed" + "start container if stopped" + "run command".
 * Note: We do NOT clean up the container automatically, so we can reuse it for subsequent commands.
 */
async function runShellCommand(args: {
  command: string
  escapeCommand: boolean
  storagePath: string
  storageMountPoint: string
  dockerContext: DockerOptions
}): Promise<string> {
  const { command, storagePath, storageMountPoint } = args

  try {
    // Ensure Docker image is built
    verifyOrBuildDockerImage(args.dockerContext)

    // Ensure container is created (if needed)
    verifyOrCreateContainer(args.dockerContext, storagePath, storageMountPoint)

    // Start container if not running
    startContainer(args.dockerContext)

    // Execute the command in container
    const output = runShellInDocker(args.dockerContext, command, args.escapeCommand)
    return output
  } catch (error: any) {
    return `Unexpected error: ${error.message}`
  }
}

/**
 * Exported shellTool, which runs arbitrary shell commands in a container
 * and allows configuring the container-mounted path (default "workspace").
 */
export interface ShellOptions {
  workingDir: string
  mountPointDir: string
  dockerOptions: DockerOptions
  escapeCommand: boolean
}

export const createShellTools = ({
  workingDir,
  mountPointDir,
  dockerOptions,
  escapeCommand,
}: ShellOptions) => {
  const dockerContext: DockerOptions = {
    name: 'shell-docker',
    defaultImageTag: 'shell:latest',
    userDockerfilePath: null,
    ...dockerOptions,
  }

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
          escapeCommand,
          storagePath: workingDir,
          storageMountPoint: mountPointDir,
          dockerContext,
        })
      },
    }),
    // a cleanup tool if you want to manually remove the container
    cleanupDockerRunner: tool({
      description: `Stops and removes the "${dockerContext.name}" container if it exists.`,
      parameters: z.object({}),
      execute: async () => {
        cleanupContainer(dockerContext)
        return `Container ${dockerContext.name} has been stopped and removed.`
      },
    }),
  }
}
