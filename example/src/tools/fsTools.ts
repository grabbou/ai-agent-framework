import { mkdir, readdir, readFile as readFileNode, writeFile } from 'node:fs/promises'

import { tool } from '@dead-simple-ai-agent/framework/tool'
import path from 'path'
import { z } from 'zod'

interface FileSystemOptions {
  workingDir: string
}

const sanitizePath = (workingDir: string, userPath: string): string => {
  const resolvedPath = path.resolve(workingDir, userPath)
  if (!resolvedPath.startsWith(workingDir)) {
    throw new Error('Path is outside the working directory.')
  }
  return resolvedPath
}

export const listFiles = (options: FileSystemOptions) =>
  tool({
    description:
      'List all files in a directory. If path is nested, you must call it separately for each segment.',
    parameters: z.object({ path: z.string().describe('Directory path to list files from') }),
    execute: async ({ path: userPath }) => {
      const dirPath = sanitizePath(options.workingDir, userPath)
      return (await readdir(dirPath)).join('\n')
    },
  })

export const currentDirectory = (options: FileSystemOptions) =>
  tool({
    description: 'Get the current working directory (sandboxed to the configured workingDir).',
    parameters: z.object({}),
    execute: async () => {
      return options.workingDir
    },
  })

export const makeDirectory = (options: FileSystemOptions) =>
  tool({
    description: 'Create a new directory.',
    parameters: z.object({ path: z.string().describe('Directory path to create') }),
    execute: async ({ path: userPath }) => {
      const dirPath = sanitizePath(options.workingDir, userPath)
      await mkdir(dirPath)
      return dirPath
    },
  })

const fileEncodingSchema = z
  .enum([
    'ascii',
    'utf8',
    'utf-8',
    'utf16le',
    'utf-16le',
    'ucs2',
    'ucs-2',
    'base64',
    'base64url',
    'latin1',
    'binary',
    'hex',
  ])
  .default('utf-8')

export const readFile = (options: FileSystemOptions) =>
  tool({
    description: 'Reads a file at a given path.',
    parameters: z.object({
      path: z.string().describe('File path to read'),
      is_image: z.boolean().describe('Specify if the file is an image'),
      encoding: fileEncodingSchema.describe('Encoding format for reading the file'),
    }),
    execute: async ({ path: userPath, is_image, encoding }) => {
      const filePath = sanitizePath(options.workingDir, userPath)
      const file = await readFileNode(filePath, { encoding: encoding as BufferEncoding })
      if (is_image) {
        return `data:image/${path.extname(filePath).toLowerCase().replace('.', '')};base64,${Buffer.from(
          file
        ).toString('base64')}` // experiment - no idea what LLM will do about it
      } else {
        return file
      }
    },
  })

export const saveFile = (options: FileSystemOptions) =>
  tool({
    description: 'Save a file at a given path.',
    parameters: z.object({
      path: z.string().describe('File path to save to'),
      content: z.string().describe('Content to save in the file'),
      encoding: fileEncodingSchema.describe('Encoding format for saving the file'),
    }),
    execute: async ({ path: userPath, content, encoding }) => {
      const filePath = sanitizePath(options.workingDir, userPath)
      await writeFile(filePath, content, { encoding: encoding as BufferEncoding })
      return 'File saved successfully: ' + filePath
    },
  })
