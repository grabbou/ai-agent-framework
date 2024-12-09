import { text } from '@clack/prompts'
import chalk from 'chalk'
import dedent from 'dedent'

/**
 * Get API key from environment variables or prompt user for it.
 */
export async function getApiKey(name: string, key: string) {
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
      process.exit(0)
    }

    return apiKey
  })()
}
