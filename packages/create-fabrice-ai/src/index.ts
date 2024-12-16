#!/usr/bin/env node

import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

import { confirm, intro, log, outro, select, spinner, text } from '@clack/prompts'
import chalk from 'chalk'
import dedent from 'dedent'
import { passion } from 'gradient-string'

import {
  copyAdditionalTemplateFiles,
  downloadAndExtractTemplate,
  formatTargetDir,
  isNodeError,
  latestReleaseDownloadLink,
} from './utils.js'

console.log(
  passion(`
  ███████╗ █████╗ ██████╗ ██████╗ ██╗ ██████╗███████╗
  ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██╔════╝██╔════╝
  █████╗  ███████║██████╔╝██████╔╝██║██║     █████╗  
  ██╔══╝  ██╔══██║██╔══██╗██╔══██╗██║██║     ██╔══╝  
  ██║     ██║  ██║██████╔╝██║  ██║██║╚██████╗███████╗
  ╚═╝     ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝
`)
)

intro(chalk.gray(`(c) 2024 Callstack Research Team`))

const projectName = await text({
  message: 'How would you like to name your project?',
  validate: (value) => {
    const isValid = /^[a-zA-Z0-9-_]+$/.test(value)
    return isValid
      ? undefined
      : 'Please provide a valid project name (no spaces or special characters).'
  },
})

if (typeof projectName !== 'string') {
  process.exit(0)
}

const targetDir = formatTargetDir(projectName)

const root = path.join(process.cwd(), targetDir)

try {
  await fs.mkdir(root)
} catch (e) {
  if (!isNodeError(e) || e.code !== 'EEXIST') {
    throw e
  }

  const overwrite = await confirm({
    message: 'Target directory is not empty. Would you like to remove it and proceed?',
  })

  if (!overwrite) {
    outro(`The directory "${root}" already exists. Try again with different name!`)
    process.exit(0)
  }

  await fs.rm(root, { recursive: true, force: true })
  await fs.mkdir(root)
}

const template = await select({
  message: 'Choose a template to get started:',
  options: [
    {
      value: {
        files: ['src/surprise_trip.ts', 'src/tools/wikipedia.ts'],
      },
      label: 'Surprise Trip Planner - travel agent creating personalized city adventures',
    },
    {
      value: {
        files: ['src/medical_survey.ts', 'src/medical_survey/workflow.ts'],
      },
      label: 'Medical Survey - Pre-visit patient questionnaire with report generation',
    },
    {
      value: {
        files: [
          'src/library_photo_to_website.ts',
          'assets/photo-library.jpg',
          'assets/book_library_template.html',
        ],
      },
      label: 'Library Photo to Website - Turn book shelf photos into browsable web catalogs',
    },
    {
      value: {
        files: ['src/ecommerce_product_description.ts', 'assets/example-sneakers.jpg'],
      },
      label:
        'E-commerce Product Description - Convert product photos into compelling store listings',
    },
    {
      value: {
        files: ['src/news_wrap_up.ts'],
      },
      label: 'News Wrap Up - Weekly news digest generator with smart summaries',
    },
    {
      value: {
        files: ['src/github_trending.ts'],
      },
      label: 'GitHub Trending - Track and summarize hot Python projects on GitHub',
    },
    {
      value: {
        files: ['src/github_trending_vector.ts', 'src/tools/askUser.ts'],
      },
      label:
        'GitHub Trending + Vector Store - Track and summarize hot Typescript projects on GitHub + get project details from vector store',
    },
    {
      value: {
        files: ['src/wikipedia_vector.ts', 'src/tools/wikipedia.ts'],
      },
      label: 'Wikipedia Vector - Search and summarize Wikipedia articles',
    },
  ],
})

if (typeof template !== 'object') {
  console.error('No template selected. Exiting...')
  process.exit(0)
}

const s = spinner()

const releaseTarballUrl = await latestReleaseDownloadLink('callstackincubator', 'fabrice-ai')

s.start(`Downloading template...`)

await downloadAndExtractTemplate(root, releaseTarballUrl, template.files)

copyAdditionalTemplateFiles(root)

s.stop('Downloaded and extracted template!')

/**
 * If user doesn't have OPENAI_API_KEY in env, ask them to create one and provide it.
 * User can decide to do it now or later.
 * If they choose to do it now, we will ask them to provide their API key.
 * If they do not provide the answer, we will continue to the next step.
 */
if (!process.env.OPENAI_API_KEY2) {
  log.warning(
    'No OPENAI_API_KEY found in environment variables. Fabrice starter projects use OpenAI and require an API key.'
  )

  log.step('Head to https://platform.openai.com/api-keys to create an API key.')

  const choice = await select({
    message: 'How would you like to provide your API key?',
    options: [
      { value: 'file', label: 'Create a .env.local file' },
      { value: 'later', label: 'I will do it later' },
    ],
  })

  if (choice === 'later') {
    log.warning('Skipping API key setup. You will get an error when running the project.')
  } else {
    const apiKey = await text({
      message: `Please provide your OpenAI API key.`,
      validate: (value) => (value.length > 0 ? undefined : `Please provide a valid API key.`),
    })

    if (typeof apiKey === 'string') {
      execSync(`echo "OPENAI_API_KEY=${apiKey}" >> ${path.join(root, '.env.local')}`)
    }
  }
}

outro('The project has been successfully created!')

console.log(dedent`
  ${chalk.bold('The project has been successfully created!')}

  To run your project, navigate to the directory and run the following commands:
  ${chalk.gray(dedent`
    cd ${projectName}
    npm install
  `)}
  
  Then, run the project:
  ${chalk.gray(`$ tsx ${template.files[0]}`)}

  Or with Bun:
  ${chalk.gray(`$ bun ${template.files[0]}`)}
`)
