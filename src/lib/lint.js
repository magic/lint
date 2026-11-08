import { resolveConfig } from './config.js'
import { buildOxlintArgs, runOxlint } from './run.js'

/**
 * Lints the given paths using the oxlint cli.
 * @param {{paths?: string|string[], config?: string, fix?: boolean, cwd?: string}} [args]
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
export const lint = (args = {}) => {
  const cwd = args.cwd || process.cwd()
  const paths = args.paths ? (Array.isArray(args.paths) ? args.paths : [args.paths]) : [cwd]
  const configFile = resolveConfig(args, cwd)

  return runOxlint(buildOxlintArgs({ configFile, paths, fix: args.fix }), cwd)
}

export default lint
