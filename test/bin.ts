import { spawn } from 'node:child_process'
import path from 'node:path'

import { fs } from '@magic/test'

import { getPaths } from '../src/bin.js'

const binPath = path.join(process.cwd(), 'src', 'bin.js')

const fixtureDir = (name: string): string =>
  path.join(process.cwd(), 'test', `.lint-integration-${name}`)

/**
 * Creates a fixture directory with the given files
 */
const createFixture = async (dir: string, files: Record<string, string>) => {
  for (const [file, content] of Object.entries(files)) {
    const filePath = path.join(dir, file)
    await fs.mkdirp(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content)
  }
}

/**
 * Runs the lint bin in the given directory, like a consumer would
 */
const runLint = (
  dir: string,
  flags: string[] = [],
  env?: object,
): Promise<{ code: number; stdout: string; stderr: string }> =>
  new Promise(resolve => {
    const child = spawn(process.execPath, [binPath, ...flags], {
      cwd: dir,
      timeout: 30000,
      env: { ...process.env, ...env },
    })

    /** @type {string[]} */
    const stdout: string[] = []
    /** @type {string[]} */
    const stderr: string[] = []

    child.stdout.on('data', chunk => stdout.push(String(chunk)))
    child.stderr.on('data', chunk => stderr.push(String(chunk)))
    child.on('close', code =>
      resolve({ code: code ?? 1, stdout: stdout.join(''), stderr: stderr.join('') }),
    )
    child.on('error', () => resolve({ code: 1, stdout: '', stderr: 'failed to start lint' }))
  })

export default [
  // getPaths: collects bare positional paths
  {
    fn: () => getPaths(['node', 'bin.js', 'src', 'test']),
    expect: ['src', 'test'],
    info: 'getPaths collects positional paths',
  },

  // getPaths: ignores the literal command token
  {
    fn: () => getPaths(['node', 'bin.js', 'lint']),
    expect: [],
    info: 'getPaths ignores the command token',
  },

  // getPaths: skips flags and the values of value-taking flags
  {
    fn: () => getPaths(['node', 'bin.js', 'lint', '-c', 'conf.ts', 'src']),
    expect: ['src'],
    info: 'getPaths skips flags and flag values',
  },

  // getPaths: skips all value flags, keeps boolean flags skipped and paths kept
  {
    fn: () => getPaths(['node', 'bin.js', '-e', 'docs/', '-i', 'lib/', '-f', 'src', 'test']),
    expect: ['src', 'test'],
    info: 'getPaths skips all value flags and their values',
  },
  {
    fn: async () => {
      const dir = fixtureDir('clean')
      await createFixture(dir, { 'src/a.js': 'const a = 1\nconsole.log(a)\n' })
      try {
        const { code } = await runLint(dir)
        return code
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: 0,
    info: 'integration: lint exits 0 when the project is clean',
  },
  {
    fn: async () => {
      const dir = fixtureDir('dirty')
      await createFixture(dir, { 'src/a.js': 'const a = 1\n' })
      try {
        const { code, stdout } = await runLint(dir)
        return code === 1 && stdout.includes('no-unused-vars')
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: true,
    info: 'integration: lint exits 1 and reports the rule when the project is dirty',
  },
  {
    fn: async () => {
      const dir = fixtureDir('paths')
      await createFixture(dir, {
        'bad.js': 'const a = 1\n',
        'good.js': 'const a = 1\nconsole.log(a)\n',
      })
      try {
        const { code } = await runLint(dir, ['--include', 'good.js'])
        return code
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: 0,
    info: 'integration: lint accepts include paths',
  },
  {
    fn: async () => {
      const dir = fixtureDir('verbose')
      await createFixture(dir, { 'a.js': 'const a = 1\nconsole.log(a)\n' })
      try {
        const { code, stderr } = await runLint(dir, ['-v'])
        return code === 0 && stderr.includes('oxlint')
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: true,
    info: 'integration: lint -v echoes the oxlint command',
  },
  {
    fn: async () => {
      const dir = fixtureDir('lint-arg')
      await createFixture(dir, { 'good.js': 'const a = 1\nconsole.log(a)\n' })
      try {
        const { code } = await runLint(dir, ['lint', 'good.js'])
        return code
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: 0,
    info: 'integration: lint skips the literal "lint" token and forwards the remaining path (getPaths)',
  },
  {
    fn: async () => {
      const dir = fixtureDir('positional')
      await createFixture(dir, {
        'bad.js': 'const a = 1\n',
        'good.js': 'const a = 1\nconsole.log(a)\n',
      })
      try {
        const { code } = await runLint(dir, ['good.js'])
        return code
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: 0,
    info: 'integration: lint forwards positional paths to oxlint',
  },
  {
    fn: async () => {
      const dir = fixtureDir('exclude')
      await createFixture(dir, {
        'bad.js': 'const a = 1\n',
        'b.test.js': 'const c = 3\n',
      })
      try {
        const { code, stdout } = await runLint(dir, ['--exclude', 'b.test.js'])
        return code === 1 && stdout.includes('bad.js') && !stdout.includes('b.test.js')
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: true,
    info: 'integration: lint --exclude excludes matching files from linting',
  },
  {
    fn: async () => {
      const dir = fixtureDir('consumer-config')
      await createFixture(dir, {
        'a.js': 'const a = 1\nconsole.log(a)\n',
        'oxlint.config.ts': 'export default {}\n',
      })
      try {
        const { code, stderr } = await runLint(dir, ['-v'])
        return code === 0 && stderr.includes(path.join(dir, 'oxlint.config.ts'))
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: true,
    info: 'integration: lint uses the consumer oxlint.config.ts when present',
  },
  {
    fn: async () => {
      const dir = fixtureDir('stderr')
      await createFixture(dir, { 'a.js': 'const a = 1\nconsole.log(a)\n' })
      // a stand-in for oxlint that writes to stderr and exits 1,
      // injected via the MAGIC_LINT_OXLINT_BIN override
      const fakeBin = path.join(dir, 'fake-oxlint.js')
      await fs.writeFile(fakeBin, 'process.stderr.write("fake oxlint error\\n")\nprocess.exit(1)\n')
      try {
        const { code, stderr } = await runLint(dir, [], { MAGIC_LINT_OXLINT_BIN: fakeBin })
        return code === 1 && stderr.includes('fake oxlint error')
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: true,
    info: 'integration: bin writes the oxlint stderr to process.stderr',
  },
  {
    fn: async () => {
      const dir = fixtureDir('color-off')
      await createFixture(dir, { 'a.js': 'const a = 1\n' })
      // a stand-in for oxlint that echoes the color env it received,
      // injected via the MAGIC_LINT_OXLINT_BIN override
      const fakeBin = path.join(dir, 'fake-oxlint.js')
      await fs.writeFile(
        fakeBin,
        'process.stdout.write(JSON.stringify({ f: process.env.FORCE_COLOR, n: process.env.NO_COLOR, c: process.env.CI }))\nprocess.exit(0)\n',
      )
      try {
        const { code, stdout } = await runLint(dir, [], {
          // normalize any ambient color env so the result is deterministic
          FORCE_COLOR: '',
          NO_COLOR: '',
          CI: '',
          MAGIC_LINT_OXLINT_BIN: fakeBin,
        })
        return code === 0 && stdout === '{"n":"1"}'
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: true,
    info: 'integration: piped output without color env passes NO_COLOR=1 to oxlint',
  },
  {
    fn: async () => {
      const dir = fixtureDir('color-on')
      await createFixture(dir, { 'a.js': 'const a = 1\n' })
      const fakeBin = path.join(dir, 'fake-oxlint.js')
      await fs.writeFile(
        fakeBin,
        'process.stdout.write(JSON.stringify({ f: process.env.FORCE_COLOR, n: process.env.NO_COLOR, c: process.env.CI }))\nprocess.exit(0)\n',
      )
      try {
        const { code, stdout } = await runLint(dir, [], {
          FORCE_COLOR: '1',
          NO_COLOR: '',
          CI: '',
          MAGIC_LINT_OXLINT_BIN: fakeBin,
        })
        return code === 0 && stdout === '{"f":"1"}'
      } finally {
        await fs.rmrf(dir)
      }
    },
    expect: true,
    info: 'integration: explicit FORCE_COLOR is passed to oxlint as FORCE_COLOR=1',
  },
]
