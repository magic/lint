#!/usr/bin/env node
export function getPaths(argv?: string[]): string[]
export function run(): Promise<{
  code: number
  stdout: string
  stderr: string
}>
