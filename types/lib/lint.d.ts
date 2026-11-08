export function lint(args?: {
  paths?: string | string[]
  config?: string
  fix?: boolean
  cwd?: string
}): Promise<{
  code: number
  stdout: string
  stderr: string
}>
export default lint
