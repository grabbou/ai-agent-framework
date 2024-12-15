import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { tool } from 'fabrice-ai/tool'
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

export const createFileSystemTools = ({ workingDir }: FileSystemOptions) => {
  return {
    listFilesFromDirectory: tool({
      description: 'List all files in a directory',
      parameters: z.object({
        path: z.string().describe('Absolute path to directory to list files from'),
      }),
      execute: async ({ path: userPath }) => {
        const dirPath = sanitizePath(workingDir, userPath)
        return (await readdir(dirPath)).join('\n')
      },
    }),
    currentDirectory: tool({
      description: 'Get the current working directory',
      parameters: z.object({}),
      execute: async () => {
        return workingDir
      },
    }),
    makeDirectory: tool({
      description: 'Create a new directory',
      parameters: z.object({ path: z.string().describe('Absolute path to directory to create') }),
      execute: async ({ path: userPath }) => {
        const dirPath = sanitizePath(workingDir, userPath)
        await mkdir(dirPath)
        return dirPath
      },
    }),
    readFile: tool({
      description: 'Read a file at a given path',
      parameters: z.object({
        path: z.string().describe('Absolute path to file to read'),
        is_image: z.boolean().describe('Specify if the file is an image'),
        encoding: fileEncodingSchema.describe(
          'Encoding format for reading the file. Use "utf-8" as default for text files'
        ),
      }),
      execute: async ({ path: userPath, is_image, encoding }) => {
        const filePath = sanitizePath(workingDir, userPath)
        const file = await readFile(filePath, { encoding })
        if (is_image) {
          return `data:image/${path.extname(filePath).toLowerCase().replace('.', '')};base64,${Buffer.from(
            file
          ).toString('base64')}`
        } else {
          return file
        }
      },
    }),
    saveFile: tool({
      description: 'Save a file at a given path',
      parameters: z.object({
        path: z.string().describe('Absolute path to file to save to'),
        content: z.string().describe('Content to save in the file'),
        encoding: fileEncodingSchema.describe(
          'Encoding format for saving the file. Use "utf-8" as default for text files'
        ),
      }),
      execute: async ({ path: userPath, content, encoding }) => {
        const filePath = sanitizePath(workingDir, userPath)
        await writeFile(filePath, content, { encoding })
        return `File saved successfully: ${filePath}`
      },
    }),
  }
}

const fileEncodingSchema = z.enum([
  'ascii',
  'utf8',
  'utf-8',
  'utf16le',
  'ucs2',
  'ucs-2',
  'base64',
  'base64url',
  'latin1',
  'binary',
  'hex',
])
