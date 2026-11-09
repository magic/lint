import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { consumerConfigName, resolveConfig, sharedConfigPath } from '../src/lib/config.js'
import { getOxlintBin, buildOxlintArgs } from '../src/lib/run.js'
import lintLib, { lint } from '../src/lib/lint.js'
import * as index from '../src/index.js'

/** @type {(name: string) => string} */
const fixtureDir = name => path.join(process.cwd(), 'test', `.lint-${name}`)

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

export default [
  {
    fn: () => getOxlintBin(),
    expect: bin => typeof bin === 'string' && bin.endsWith('oxlint') && existsSync(bin),
    info: 'getOxlintBin resolves the shipped oxlint binary',
  },
  {
    fn: () => {
      const original = process.env.MAGIC_LINT_OXLINT_BIN
      process.env.MAGIC_LINT_OXLINT_BIN = '/custom/oxlint'
      try {
        return getOxlintBin()
      } finally {
        if (original === undefined) {
          delete process.env.MAGIC_LINT_OXLINT_BIN
        } else {
          process.env.MAGIC_LINT_OXLINT_BIN = original
        }
      }
    },
    expect: '/custom/oxlint',
    info: 'getOxlintBin respects the MAGIC_LINT_OXLINT_BIN env override',
  },
  {
    fn: () => sharedConfigPath,
    expect: bin => typeof bin === 'string' && bin.endsWith(path.join('src', 'oxlint.config.js')),
    info: 'sharedConfigPath points at src/oxlint.config.js',
  },
  {
    fn: () => consumerConfigName,
    expect: 'oxlint.config.ts',
    info: 'consumerConfigName is oxlint.config.ts',
  },
  {
    fn: () => resolveConfig({ config: 'my.config.ts' }, '/project'),
    expect: path.join('/project', 'my.config.ts'),
    info: 'resolveConfig resolves a relative config against cwd',
  },
  {
    fn: () => resolveConfig({ config: '/abs/my.config.ts' }, '/project'),
    expect: '/abs/my.config.ts',
    info: 'resolveConfig passes an absolute config through',
  },
  {
    fn: () => {
      const dir = fixtureDir('resolve-consumer')
      createFixture(dir, { 'oxlint.config.ts': 'export default { rules: {} }' })
      try {
        const resolved = resolveConfig({}, dir)
        return resolved === path.join(dir, 'oxlint.config.ts')
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: true,
    info: 'resolveConfig prefers the consumer oxlint.config.ts when it exists',
  },
  {
    fn: () => {
      // the ./config export target of this package, as consumers import it.
      // not imported here directly, because the test runner cannot load .ts files
      return (
        existsSync(sharedConfigPath) &&
        readFileSync(sharedConfigPath, 'utf8').includes('export default defineConfig')
      )
    },
    expect: true,
    info: 'the shared config behind the ./config export exists and defines the config',
  },
  {
    fn: () => resolveConfig({}, '/nonexistent-project-dir'),
    expect: sharedConfigPath,
    info: 'resolveConfig falls back to the shared config',
  },
  {
    fn: () => lintLib === lint && index.default === lint,
    expect: true,
    info: 'lint is the default export of lib/lint.js and of the package entry',
  },
  {
    fn: () =>
      index.lint === lint &&
      index.resolveConfig === resolveConfig &&
      index.getOxlintBin === getOxlintBin &&
      index.sharedConfigPath === sharedConfigPath,
    expect: true,
    info: 'the package entry re-exports the lib functions (backward compatible)',
  },
  {
    fn: async () => {
      const dir = fixtureDir('clean')
      createFixture(dir, { 'src/a.js': 'const a = 1\nconsole.log(a)\n' })
      try {
        return (await lint({ cwd: dir })).code
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: 0,
    info: 'lint exits 0 when the project is clean',
  },
  {
    fn: async () => {
      const dir = fixtureDir('dirty')
      createFixture(dir, { 'src/a.js': 'const a = 1\n' })
      try {
        const result = await lint({ cwd: dir })
        return result.code === 1 && result.stdout.includes('no-unused-vars')
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: true,
    info: 'lint exits 1 and reports the rule when the project is dirty',
  },
  {
    fn: async () => {
      const dir = fixtureDir('consumer-config')
      createFixture(dir, {
        'oxlint.config.ts': "export default { rules: { 'no-unused-vars': 'off' } }",
        'a.js': 'const a = 1\n',
      })
      try {
        const result = await lint({ cwd: dir })
        return result.code
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: 0,
    info: 'lint uses the consumer oxlint.config.ts over the shared config',
  },
  {
    fn: async () => {
      const dir = fixtureDir('paths')
      createFixture(dir, { 'bad.js': 'const a = 1\n', 'good.js': 'const a = 1\nconsole.log(a)\n' })
      try {
        return (await lint({ cwd: dir, paths: ['good.js'] })).code
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: 0,
    info: 'lint only lints the given paths',
  },
  {
    fn: async () => {
      const dir = fixtureDir('string-path')
      createFixture(dir, { 'a.js': 'const a = 1\n' })
      try {
        return (await lint({ cwd: dir, paths: 'a.js' })).code
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: 1,
    info: 'lint accepts a string path',
  },
  {
    fn: async () => {
      const dir = fixtureDir('fix')
      createFixture(dir, { 'a.js': 'const a = 1\n' })
      try {
        const result = await lint({ cwd: dir, fix: true })
        return result.code === 1 && result.stdout.includes('no-unused-vars')
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: true,
    info: 'lint with fix: true passes --fix to oxlint',
  },
  {
    fn: () => buildOxlintArgs({ configFile: 'c.ts', paths: ['a.js'], fix: true }),
    expect: args => args.includes('--fix'),
    info: 'buildOxlintArgs adds --fix when fix is true',
  },
  {
    fn: () => lint({}),
    expect: result => typeof result === 'object' && typeof result.code === 'number',
    info: 'lint() without cwd falls back to process.cwd()',
  },
  {
    fn: async () => {
      const dir = fixtureDir('signal')
      createFixture(dir, { 'a.js': 'const a = 1\nconsole.log(a)\n' })
      const fakeBin = path.join(dir, 'fake-oxlint.js')
      writeFileSync(fakeBin, 'process.kill(process.pid, "SIGKILL")\n')
      const original = process.env.MAGIC_LINT_OXLINT_BIN
      process.env.MAGIC_LINT_OXLINT_BIN = fakeBin
      try {
        const result = await lint({ cwd: dir })
        return result.code === 1 && result.stdout === '' && result.stderr === ''
      } finally {
        if (original === undefined) {
          delete process.env.MAGIC_LINT_OXLINT_BIN
        } else {
          process.env.MAGIC_LINT_OXLINT_BIN = original
        }
        rmSync(dir, { recursive: true, force: true })
      }
    },
    expect: true,
    info: 'lint resolves to code 1 when the oxlint process is killed by a signal',
  },
]
