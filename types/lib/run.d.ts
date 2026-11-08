export function getOxlintBin(): string
export function buildOxlintArgs({
  configFile,
  paths,
  fix,
}?: {
  configFile?: string
  paths?: string[]
  fix?: boolean
}): string[]
export function runOxlint(
  oxlintArgs: string[],
  cwd: string,
): Promise<{
  code: number
  stdout: string
  stderr: string
}>
