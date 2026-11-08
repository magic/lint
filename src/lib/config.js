import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The oxlint config shared with all consumers,
 * so they do not have to declare rules themselves
 * @type {string}
 */
export const sharedConfigPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'oxlint.config.ts',
)

/**
 * Name of the consumer config file,
 * checked in the linted project before falling back to the shared config
 * @type {string}
 */
export const consumerConfigName = 'oxlint.config.ts'

/**
 * Resolves the config file to pass to the oxlint cli.
 * An explicit config is passed through as-is,
 * a consumer config found in the project is used,
 * otherwise the shared config is used.
 * @param {{config?: string}} [args]
 * @param {string} [cwd=process.cwd()]
 * @returns {string}
 */
export const resolveConfig = (args = {}, cwd = process.cwd()) => {
  if (args.config) {
    return path.isAbsolute(args.config) ? args.config : path.join(cwd, args.config)
  }

  const consumerConfig = path.join(cwd, consumerConfigName)

  if (existsSync(consumerConfig)) {
    return consumerConfig
  }

  return sharedConfigPath
}
