import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const binPath = path.join(process.cwd(), 'src', 'bin.js')

/** @type {(name: string) => string} */
const fixtureDir = name => path.join(process.cwd(), 'test', `.lint-integration-${name}`)

/**
 * Creates a fixture directory with the given files
 * @param {string} dir
 * @param {Record<string, string>} files
 */
const createFixture = (dir, files) => {
  for (const [file, content] of Object.entries(files)) {
    const filePath = path.join(dir, file)
    mkdirSync(path.dirname(filePath), { recursive: true })
    writeFileSync(filePath, content)
  }
}

/**
 * Runs the lint bin in the given directory, like a consumer would
 * @param {string} dir
 * @param {string[]} flags
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
const runLint = (dir, flags = [], env = {}) =>
  new Promise(resolve => {
    const child = spawn(process.execPath, [binPath, ...flags], {
      cwd: dir,
      timeout: 30000,
      env: { ...process.env, ...env },
    })

    /** @type {string[]} */
    const stdout = []
    /** @type {string[]} */
    const stderr = []

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
      createFixture(dir, { 'src/a.js': 'const a = 1\nconsole.log(a)\n' })
      try {
        const { code } = await runLint(dir)
        return code
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: 0,
    info: 'integration: lint exits 0 when the project is clean',
  },
  {
    fn: async () => {
      const dir = fixtureDir('dirty')
      createFixture(dir, { 'src/a.js': 'const a = 1\n' })
      try {
        const { code, stdout } = await runLint(dir)
        return code === 1 && stdout.includes('no-unused-vars')
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: true,
    info: 'integration: lint exits 1 and reports the rule when the project is dirty',
  },
  {
    fn: async () => {
      const dir = fixtureDir('consumer-config')
      createFixture(dir, {
        'oxlint.config.ts': "export default { rules: { 'no-unused-vars': 'off' } }",
        'a.js': 'const a = 1\n',
      })
      try {
        const { code } = await runLint(dir)
        return code
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: 0,
    info: 'integration: lint uses the consumer oxlint.config.ts over the shared config',
  },
  {
    fn: async () => {
      const dir = fixtureDir('explicit-config')
      createFixture(dir, {
        'my.config.ts': "export default { rules: { 'no-unused-vars': 'off' } }",
        'a.js': 'const a = 1\n',
      })
      try {
        const { code } = await runLint(dir, ['-c', 'my.config.ts'])
        return code
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: 0,
    info: 'integration: lint -c uses the given config',
  },
  {
    fn: async () => {
      const dir = fixtureDir('paths')
      createFixture(dir, { 'bad.js': 'const a = 1\n', 'good.js': 'const a = 1\nconsole.log(a)\n' })
      try {
        const { code } = await runLint(dir, ['good.js'])
        return code
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: 0,
    info: 'integration: lint accepts positional paths',
  },
  {
    fn: async () => {
      const dir = fixtureDir('verbose')
      createFixture(dir, { 'a.js': 'const a = 1\nconsole.log(a)\n' })
      try {
        const { code, stderr } = await runLint(dir, ['-v'])
        return code === 0 && stderr.includes('oxlint')
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: true,
    info: 'integration: lint -v echoes the oxlint command',
  },
  {
    fn: async () => {
      const dir = fixtureDir('extends')
      createFixture(dir, {
        'oxlint.config.ts':
          "import shared from '@magic/lint/config'\nexport default { extends: [shared] }\n",
        'a.js': 'const a = 1\n',
      })
      const packageDir = path.join(dir, 'node_modules', '@magic')
      mkdirSync(packageDir, { recursive: true })
      symlinkSync(process.cwd(), path.join(packageDir, 'lint'))
      try {
        const { code, stdout } = await runLint(dir)
        return code === 1 && stdout.includes('no-unused-vars')
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: true,
    info: 'integration: a consumer config extends @magic/lint/config and inherits its rules',
  },
  {
    fn: async () => {
      const dir = fixtureDir('lint-arg')
      createFixture(dir, { 'good.js': 'const a = 1\nconsole.log(a)\n' })
      try {
        const { code } = await runLint(dir, ['lint', 'good.js'])
        return code
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: 0,
    info: 'integration: lint skips the literal "lint" positional arg (getPaths)',
  },
  {
    fn: async () => {
      const dir = fixtureDir('stderr')
      createFixture(dir, { 'a.js': 'const a = 1\nconsole.log(a)\n' })
      // a stand-in for oxlint that writes to stderr and exits 1,
      // injected via the MAGIC_LINT_OXLINT_BIN override
      const fakeBin = path.join(dir, 'fake-oxlint.js')
      writeFileSync(fakeBin, 'process.stderr.write("fake oxlint error\\n")\nprocess.exit(1)\n')
      try {
        const { code, stderr } = await runLint(dir, [], { MAGIC_LINT_OXLINT_BIN: fakeBin })
        return code === 1 && stderr.includes('fake oxlint error')
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: true,
    info: 'integration: bin writes the oxlint stderr to process.stderr',
  },
]
