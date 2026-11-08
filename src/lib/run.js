import { spawn } from 'node:child_process'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/**
 * Resolves the oxlint binary shipped with our oxlint dependency.
 * Can be overridden with the MAGIC_LINT_OXLINT_BIN env variable (for testing)
 * @returns {string}
 */
export const getOxlintBin = () =>
  process.env.MAGIC_LINT_OXLINT_BIN ||
  path.join(path.dirname(require.resolve('oxlint/package.json')), 'bin', 'oxlint')

/**
 * Builds the oxlint cli argument list from parsed arguments
 * @param {{configFile?: string, paths?: string[], fix?: boolean}} params
 * @returns {string[]}
 */
export const buildOxlintArgs = ({ configFile, paths = [], fix } = {}) => {
  const oxlintArgs = ['-c', configFile]

  if (fix) {
    oxlintArgs.push('--fix')
  }

  oxlintArgs.push(...paths)

  return oxlintArgs
}

/**
 * Runs oxlint with the given arguments
 * @param {string[]} oxlintArgs
 * @param {string} cwd
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
export const runOxlint = (oxlintArgs, cwd) =>
  new Promise(resolve => {
    const child = spawn(process.execPath, [getOxlintBin(), ...oxlintArgs], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    /** @type {string[]} */
    const stdout = []
    /** @type {string[]} */
    const stderr = []

    child.stdout.on('data', chunk => stdout.push(String(chunk)))
    child.stderr.on('data', chunk => stderr.push(String(chunk)))

    child.on('close', code =>
      resolve({ code: code ?? 1, stdout: stdout.join(''), stderr: stderr.join('') }),
    )
    child.on('error', () => resolve({ code: 1, stdout: '', stderr: 'failed to start oxlint' }))
  })
