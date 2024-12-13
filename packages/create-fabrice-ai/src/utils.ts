import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promises as Stream, Readable } from 'node:stream'

import { confirm, outro, text } from '@clack/prompts'
import chalk from 'chalk'
import dedent from 'dedent'
import { extract } from 'tar'

export function formatTargetDir(targetDir: string) {
  return targetDir.trim().replace(/\/+$/g, '')
}

/**
 * Get API key from environment variables or prompt user for it.
 */
export async function requireApiKey(name: string, key: string, root: string) {
  if (key in process.env) {
    return process.env[key]
  }
  return (async () => {
    let apiKey: string | symbol
    do {
      apiKey = await text({
        message: dedent`
          ${chalk.bold(`Please provide your ${name} API key.`)}

          To skip this message, set ${chalk.bold(key)} env variable, and run again. 
          
          You can do it in three ways:
          - by creating an ${chalk.bold('.env.local')} file (make sure to ${chalk.bold('.gitignore')} it)
            ${chalk.gray(`\`\`\`
              ${key}=<your-key>
              \`\`\`
            `)}
          - by setting it as an env variable in your shell (e.g. in ~/.zshrc or ~/.bashrc):
            ${chalk.gray(`\`\`\`
              export ${key}=<your-key>
              \`\`\`
            `)},
          `,
        validate: (value) => (value.length > 0 ? undefined : `Please provide a valid ${key}.`),
      })
    } while (typeof apiKey === 'undefined')

    if (typeof apiKey === 'symbol') {
      outro(chalk.gray('Bye!'))
      process.exit(0)
    }

    const save = await confirm({
      message: `Do you want to save it for future runs in .env.local?`,
    })

    if (save) {
      execSync(`echo "${key}=${apiKey}" >> ${path.join(root, '.env.local')}`)
    }

    return apiKey
  })()
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
  const files = [
    { src: '../_gitignore', dest: '.gitignore' },
    { src: '../README.md', dest: 'README.md' },
    { src: '../_tsconfig.json', dest: 'tsconfig.json' },
  ]

  for (const file of files) {
    execSync(`cp ${path.join(import.meta.dirname, file.src)} ${path.join(root, file.dest)}`)
  }
}
