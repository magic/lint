export function getOxlintBin(): string
export function buildOxlintArgs({
  configFile,
  paths,
  args,
}?: {
  configFile?: string
  paths?: string[]
  args?: Record<string, string | string[]>
}): string[]
export function colorEnv(
  env?: Record<string, string | undefined>,
  isTTY?: boolean,
): Record<string, string | undefined>
export function runOxlint(
  oxlintArgs: string[],
  cwd: string,
): Promise<{
  code: number
  stdout: string
  stderr: string
}>
