import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promises as Stream, Readable } from 'node:stream'

import { extract } from 'tar'

export function formatTargetDir(targetDir: string) {
  return targetDir.trim().replace(/\/+$/g, '')
}

export async function latestReleaseDownloadLink(
  organization: string,
  repo: string
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${organization}/${repo}/releases/latest`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch release info from ${response.url}.`)
  }

  const body = await response.json()
  if (!('tarball_url' in body) || typeof body.tarball_url !== 'string') {
    throw new Error(`Failed to get tarball url from ${response.url}.`)
  }

  return body.tarball_url
}

export async function downloadAndExtractTemplate(root: string, tarball: string, files: string[]) {
  const response = await fetch(tarball)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch the code for example from ${response.url}.`)
  }

  await Stream.pipeline([
    // @ts-ignore
    Readable.fromWeb(response.body),
    extract({
      cwd: path.join(import.meta.dirname),
      strip: 1,
    }),
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
  const files = [
    { src: '../_gitignore', dest: '.gitignore' },
    { src: '../README.md', dest: 'README.md' },
    { src: '../_tsconfig.json', dest: 'tsconfig.json' },
  ]

  for (const file of files) {
    execSync(`cp ${path.join(import.meta.dirname, file.src)} ${path.join(root, file.dest)}`)
  }
}
