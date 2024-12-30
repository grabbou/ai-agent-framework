import { execFile, execFileSync } from 'child_process'
import { tool } from 'fabrice-ai/tool'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { z } from 'zod'

const execFileAsync = promisify(execFile)

/**
 * Configuration options for creating the Pandoc Tools.
 */
interface PandocToolOptions {
  /**
   * Path to the pandoc binary (default: 'pandoc' in PATH)
   */
  pandocPath?: string

  /**
   * Directory in which to operate for file-based conversions.
   * (e.g., '/tmp', ensure it exists and is writable)
   */
  workingDir?: string
}

/**
 * Default values for the Pandoc Tool options.
 */
const defaults: Required<PandocToolOptions> = {
  pandocPath: 'pandoc',
  workingDir: process.cwd(),
}

/**
 * Utility to check if Pandoc is actually installed & working.
 * Throws an error if not found.
 */
function ensurePandocExists(pandocPath: string) {
  try {
    // Just try running `pandoc --version` synchronously.
    // If it fails, it will throw.
    execFileSync(pandocPath, ['--version'], { stdio: 'ignore' })
  } catch (error) {
    throw new Error(
      `Pandoc not found or not executable at path: ${pandocPath}. Go to https://pandoc.org for installation details. Use "homebrew install pandoc" if you are on MacOS and using Homebrew.`
    )
  }
}

/**
 * Safely resolve a filename within workingDir, ensuring it doesn't escape.
 */
function resolveInWorkingDir(workingDir: string, fileName: string): string {
  const resolved = path.resolve(workingDir, fileName)
  if (!resolved.startsWith(path.resolve(workingDir))) {
    // If the resolved path doesn't start with the workingDir, user tried to escape
    throw new Error(`File path "${fileName}" is outside the working directory: ${workingDir}`)
  }
  return resolved
}

/**
 * Shared function to call Pandoc. We allow passing either
 * (A) input via file path or
 * (B) input via a Buffer/string (stdin).
 *
 * If `outputFile` is specified, we use the `-o` argument.
 * Otherwise, we capture stdout (return it).
 */
async function runPandoc({
  pandocPath,
  args,
  workingDir,
  inputData,
}: {
  pandocPath: string
  args: string[]
  workingDir: string
  inputData?: string | Buffer
}): Promise<{ stdout: string | Buffer }> {
  const result = await execFileAsync(pandocPath, args, {
    cwd: workingDir,
    maxBuffer: 50 * 1024 * 1024, // 50 MB
    input: inputData, // if defined, piped via stdin
    encoding: inputData ? 'buffer' : 'utf8',
    // Explanation: If we're passing binary or text to stdin, we might not need encoding at all.
    // But to unify, we can read stdout as a Buffer if inputData is set (content-based).
  })
  // result.stdout might be a Buffer or string depending on `encoding`.
  return { stdout: result.stdout }
}

/**
 * Factory function that returns two tools:
 * 1) convertFileWithPandoc   (file-based I/O)
 * 2) convertContentWithPandoc (content-based I/O)
 */
export function createPandocTool(options?: PandocToolOptions) {
  const config = {
    ...defaults,
    ...options,
  }

  // Ensure pandoc is installed at initialization:
  ensurePandocExists(config.pandocPath)

  return {
    /**
     * Tool #1: convertFileWithPandoc
     *
     * Converts a file from one format to another using Pandoc.
     * - fromFormat: "markdown", "docx", "html", etc.
     * - toFormat:   "pdf", "docx", "html", etc.
     * - inputFileName:   relative to workingDir
     * - outputFileName:  relative to workingDir
     */
    convertFileWithPandoc: tool({
      description:
        'Converts a file from one format to another (via Pandoc). Requires inputFileName & outputFileName in workingDir. No direct content is handled.',
      parameters: z.object({
        fromFormat: z.string().describe('E.g. "markdown", "html", "docx"'),
        toFormat: z.string().describe('E.g. "pdf", "docx", "html"'),
        inputFileName: z.string().describe('File in workingDir to read from'),
        outputFileName: z.string().describe('File in workingDir to write to'),
      }),
      execute: async ({ fromFormat, toFormat, inputFileName, outputFileName }) => {
        try {
          // 1. Resolve the paths
          const inputPath = resolveInWorkingDir(config.workingDir, inputFileName)
          const outputPath = resolveInWorkingDir(config.workingDir, outputFileName)

          // 2. Check input file
          if (!fs.existsSync(inputPath)) {
            throw new Error(`Input file does not exist: ${inputPath}`)
          }

          // 3. Build Pandoc arguments
          const args = [inputPath, '-f', fromFormat, '-t', toFormat, '-o', outputPath]

          // 4. Call the shared runPandoc
          await runPandoc({
            pandocPath: config.pandocPath,
            args,
            workingDir: config.workingDir,
          })

          // 5. Check if output file was created
          if (!fs.existsSync(outputPath)) {
            throw new Error(`Output file not created: ${outputPath}`)
          }

          // 6. Return success
          return JSON.stringify({
            success: true,
            fromFormat,
            toFormat,
            inputPath,
            outputPath,
          })
        } catch (error) {
          throw new Error(`Pandoc file-based conversion failed: ${error}`)
        }
      },
    }),

    /**
     * Tool #2: convertContentWithPandoc
     *
     * Operates on raw string content. (e.g., from markdown to docx)
     * By default, if the output is expected to be binary (docx, pdf, etc.),
     * we return base64. Otherwise, return plain text.
     */
    convertContentWithPandoc: tool({
      description:
        'Converts raw string content from one format to another (via Pandoc). Returns output as text or base64-encoded.',
      parameters: z.object({
        fromFormat: z.string().describe('E.g. "markdown", "html"'),
        toFormat: z.string().describe('E.g. "docx", "pdf", "html"'),
        content: z.string().describe('Raw content to convert.'),
        returnAsBase64: z
          .boolean()
          .describe(
            'If true (default), returns base64 (useful for docx/pdf). Otherwise, returns plain text.'
          ),
      }),
      execute: async ({ fromFormat, toFormat, content, returnAsBase64 }) => {
        try {
          // We will NOT use -o with output file. We'll capture stdout.

          // 1. Build Pandoc arguments.
          //    We do not specify -o, so pandoc will write to stdout.
          const args = ['-f', fromFormat, '-t', toFormat]

          // 2. Call the shared runPandoc with `inputData`
          const { stdout } = await runPandoc({
            pandocPath: config.pandocPath,
            args,
            workingDir: config.workingDir,
            inputData: content, // pass content via stdin
          })

          // 3. Decide how to return it
          //    `stdout` might be a Buffer if we set `encoding: 'buffer'`
          const outputBuffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout, 'utf8')

          let output: string
          if (returnAsBase64) {
            output = outputBuffer.toString('base64')
          } else {
            output = outputBuffer.toString('utf8')
          }

          return JSON.stringify({
            success: true,
            fromFormat,
            toFormat,
            returnAsBase64,
            output,
          })
        } catch (error) {
          throw new Error(`Pandoc content-based conversion failed: ${error}`)
        }
      },
    }),
  }
}
