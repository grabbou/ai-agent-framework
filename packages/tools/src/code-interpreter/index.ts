import { tool } from '@dead-simple-ai-agent/framework/tool'
import { execSync } from 'child_process'
import docker from 'dockerode'
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

const verifyDockerImage = async (): Promise<void> => {
  const client = new docker()

  try {
    await client.getImage(interpreterOptions.defaultImageTag).inspect()
  } catch (error) {
    let dockerfilePath: string
    if (
      interpreterOptions.userDockerfilePath &&
      fs.existsSync(interpreterOptions.userDockerfilePath)
    ) {
      dockerfilePath = interpreterOptions.userDockerfilePath
    } else {
      dockerfilePath = import.meta.dirname

      if (!fs.existsSync(dockerfilePath)) {
        console.log(dockerfilePath + ' does not exist')
        throw new Error(`Dockerfile not found in ${dockerfilePath}`)
      }
    }
    await client.buildImage(
      {
        context: dockerfilePath,
        src: ['Dockerfile'],
      },
      { t: interpreterOptions.defaultImageTag }
    )
  }
}

const initDockerContainer = async (): Promise<docker.Container> => {
  const client = new docker()
  const containerName = 'code-interpreter'
  const currentPath = process.cwd()

  // Remove existing container if running
  try {
    const existingContainer = await client.getContainer(containerName)
    await existingContainer.stop()
    await existingContainer.remove()
  } catch (error) {
    // No action needed if container doesn't exist
  }

  return client.createContainer({
    Image: interpreterOptions.defaultImageTag,
    name: containerName,
    Tty: true,
    HostConfig: {
      Binds: [`${currentPath}:/workspace`],
    },
    WorkingDir: '/workspace',
  })
}

const installLibraries = async (
  container: docker.Container,
  libraries: string[]
): Promise<void> => {
  for (const library of libraries) {
    await container.exec({
      Cmd: ['pip', 'install', library],
      AttachStdout: true,
      AttachStderr: true,
    })
  }
}

const runCodeInDocker = async (code: string, librariesUsed: string[]): Promise<string> => {
  await verifyDockerImage()
  const container = await initDockerContainer()
  await container.start()

  try {
    await installLibraries(container, librariesUsed)
  } catch (error) {
    console.log('Failed to install libraries:', error)
  }

  const exec = await container.exec({
    Cmd: ['python3', '-c', code],
    AttachStdout: true,
    AttachStderr: true,
  })

  const result = await exec.start({
    hijack: true,
    stdin: false,
  })

  await container.stop()
  await container.remove()

  return result.readable ? result.readable.toString() : 'Execution failed'
}

const runCodeUnsafe = async (code: string, librariesUsed: string[]): Promise<string> => {
  for (const library of librariesUsed) {
    execSync(`pip install ${library}`)
  }

  try {
    const result = eval(code)
    return result ? result.toString() : 'No result variable found.'
  } catch (error) {
    return `An error occurred: ${error}`
  }
}

const runCode = async (args: { code?: string; librariesUsed?: string[] }): Promise<string> => {
  const code = args.code || args.code
  const librariesUsed = args.librariesUsed || []

  if (interpreterOptions.unsafeMode) {
    return runCodeUnsafe(code!, librariesUsed)
  } else {
    return await runCodeInDocker(code!, librariesUsed)
  }
}

export const codeInterpreter = tool({
  description: 'Interprets Python3 code strings with a final print statement.',
  parameters: z.object({
    code: z.string().describe('Python3 code to be interpreted.'),
    librariesUsed: z.array(z.string()).describe('Python3 libraries used in the code.'),
  }),
  execute: ({ code, librariesUsed }) => {
    if (!code) {
      throw new Error('Python3 code is required.')
    }
    return runCode({ code, librariesUsed })
  },
})
