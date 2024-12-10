import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promises as Stream, Readable } from 'node:stream'

import { extract } from 'tar'

export function formatTargetDir(targetDir: string) {
  return targetDir.trim().replace(/\/+$/g, '')
}

export async function downloadAndExtractTemplate(root: string, tarball: string, files: string[]) {
  const response = await fetch(tarball)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch the code for example from ${response.url}.`)
  }

  await Stream.pipeline([
    // @ts-ignore
    Readable.fromWeb(response.body),
    extract(
      {
        cwd: tmpdir(),
        strip: 1,
      },
      ['fabrice-ai-main/example']
    ),
  ])

  const filesToCopy = [...files, 'package.json']

  /**
   * Copy all files from example to destination, making folders on the go
   */
  for (const file of filesToCopy) {
    execSync(`mkdir -p ${path.join(root, path.dirname(file))}`)
    execSync(`mv ${path.join(tmpdir(), `example/${file}`)} ${path.join(root, file)}`)
  }
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return (error as NodeJS.ErrnoException).code !== undefined
}

/**
 * Copy additional files to the root directory
 */
export async function copyAdditionalTemplateFiles(root: string) {
  execSync(`cp ${path.join(__dirname, '../_gitignore')} ${path.join(root, '.gitignore')}`)
  execSync(`cp ${path.join(__dirname, '../README.md')} ${path.join(root, 'README.md')}`)
  execSync(`cp ${path.join(__dirname, '../_tsconfig.json')} ${path.join(root, 'tsconfig.json')}`)
}
