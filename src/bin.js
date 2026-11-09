#!/usr/bin/env node

import cli from '@magic/cli'
import fs from '@magic/fs'
import log from '@magic/log'

import { resolveConfig } from './lib/config.js'
import { buildOxlintArgs, getOxlintBin, runOxlint } from './lib/run.js'
import { fileURLToPath } from 'node:url'

const { args } = cli({
  options: [
    ['--config', '--conf', '-c'],
    ['--fix', '-f'],
    ['--verbose', '-v'],
    ['--exclude', '--ignore', '-e'],
    ['--include', '-i'],
  ],
  single: ['--config', '--fix', '--verbose'],
  help: {
    name: '@magic/lint',
    header: 'lint code using oxlint',
    options: {
      '--config':
        'path to the oxlint config. if not given, the oxlint.config.ts of the project is used, or the config shared by @magic/lint.',
      '--fix': 'fix as many issues as possible',
      '--verbose': 'echo the oxlint command',
      '--exclude': 'exclude dir or file from linting',
      '--include': 'include files or dirs in linting. excludes all other files.',
    },
    example: `
lint [paths]     - lint the given paths, or the current directory
lint -c conf.ts  - lint with the given config
`.trim(),
  },
})

export const run = async () => {
  const cwd = process.cwd()
  const configFile = await resolveConfig(args, cwd)
  const oxlintArgs = buildOxlintArgs({ configFile, args })

  if (args.verbose) {
    log.warn('lint', `running: ${process.execPath} ${getOxlintBin()} ${oxlintArgs.join(' ')}`)
  }

  const result = await runOxlint(oxlintArgs, cwd)

  if (result.stdout.trim()) {
    process.stdout.write(result.stdout)
  }

  if (result.stderr.trim()) {
    process.stderr.write(result.stderr)
  }

  return result
}

// only run when executed directly, not when imported (e.g. by tests).
// argv[1] may be a symlink (node_modules/.bin/f) while import.meta.url is the
// real file, so both sides must be compared by realpath.
const isMain =
  process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  try {
    const result = await run()
    process.exit(result.code ?? 0)
  } catch (error) {
    log.error(error)
    process.exit(1)
  }
}
