#!/usr/bin/env node
export function run(): Promise<{
  code: number
  stdout: string
  stderr: string
}>
