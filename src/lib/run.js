import { spawn } from 'node:child_process'
import path from 'node:path'
import { createRequire } from 'node:module'
import is from '@magic/types'

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
 * @param {{configFile?: string, paths?: string[], args?: Record<string, string | string[]>}} params
 * @returns {string[]}
 */
export const buildOxlintArgs = ({ configFile, paths, args = {} } = {}) => {
  const oxlintArgs = []

  if (is.arr(args.exclude)) {
    args.exclude.forEach(arg => {
      oxlintArgs.push('--ignore-path', arg)
    })
  }

  if (args.fix) {
    oxlintArgs.push('--fix')
  }

  oxlintArgs.push('-c', configFile)

  if (is.arr(paths)) {
    paths.forEach(arg => {
      oxlintArgs.push(arg)
    })
  }

  if (is.arr(args.include)) {
    args.include.forEach(arg => {
      oxlintArgs.push(arg)
    })
  }

  return oxlintArgs
}

/**
 * oxlint decides whether to emit colors from its own stdout being a TTY
 * (plus the CI / FORCE_COLOR env). Since we always pipe it, its TTY check
 * would always be false and the colors would be lost.
 *
 * Instead, we base the decision on this process's stdout — what the user
 * actually sees — and pass the decision to oxlint via its env.
 *
 * Precedence: NO_COLOR > FORCE_COLOR > stdout is a TTY > CI
 * @param {Record<string, string | undefined>} [env]
 * @param {boolean} [isTTY]
 * @returns {Record<string, string | undefined>} the env to pass to the oxlint child process
 */
export const colorEnv = (env = process.env, isTTY = Boolean(process.stdout.isTTY)) => {
  const childEnv = { ...env }

  const isSet = v => v !== undefined && v !== ''
  const color =
    !isSet(childEnv.NO_COLOR) &&
    ((isSet(childEnv.FORCE_COLOR) && childEnv.FORCE_COLOR !== '0') || isTTY || isSet(childEnv.CI))

  if (color) {
    childEnv.FORCE_COLOR = '1'
    delete childEnv.NO_COLOR
    delete childEnv.CI
  } else {
    delete childEnv.FORCE_COLOR
    delete childEnv.CI
    childEnv.NO_COLOR = '1'
  }

  return childEnv
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
      // oxlint's stdout is piped, so it would never detect a TTY and would
      // drop its colors. Pass the color decision (based on our own stdout)
      // through env instead, so `npm run lint` in a terminal stays colored
      // while `lint | tee log.txt` stays plain.
      env: colorEnv(),
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
    child.on('error', error =>
      resolve({ code: 1, stdout: '', stderr: `failed to start oxlint: ${error.message}\n` }),
    )
  })
