import { spawn } from 'node:child_process'
import path from 'node:path'

import { fs } from '@magic/test'

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
    info: 'integration: lint skips the literal "lint" positional arg (getPaths)',
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
]
