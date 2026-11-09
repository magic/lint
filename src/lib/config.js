import fs from '@magic/fs'
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
  'oxlint.config.js',
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
 * @returns {Promise<string>}
 */
export const resolveConfig = async (args = {}, cwd = process.cwd()) => {
  if (args.config) {
    return path.isAbsolute(args.config) ? args.config : path.join(cwd, args.config)
  }

  const consumerConfigPath = path.join(cwd, consumerConfigName)
  const consumerConfigExists = await fs.exists(consumerConfigPath)

  if (consumerConfigExists) {
    return consumerConfigPath
  }

  return sharedConfigPath
}
