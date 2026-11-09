/**
 * The oxlint config shared with all consumers,
 * so they do not have to declare rules themselves
 * @type {string}
 */
export const sharedConfigPath: string
/**
 * Name of the consumer config file,
 * checked in the linted project before falling back to the shared config
 * @type {string}
 */
export const consumerConfigName: string
export function resolveConfig(
  args?: {
    config?: string
  },
  cwd?: string,
): Promise<string>
