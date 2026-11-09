import { buildOxlintArgs, getOxlintBin } from '../../src/lib/run.js'

export default [
  // Test run.js lines 26-29: args.exclude branch
  {
    fn: () =>
      buildOxlintArgs({
        configFile: 'oxlint.config.js',
        args: {
          exclude: ['*.test.ts', '*.spec.ts'],
        },
      }),
    expect: ['--ignore-path', '*.test.ts', '--ignore-path', '*.spec.ts', '-c', 'oxlint.config.js'],
    info: 'buildOxlintArgs includes --ignore-path for each exclude pattern',
  },

  // Test run.js lines 32-33: args.fix branch
  {
    fn: () => {
      const args = { fix: true } as unknown as Record<string, string | string[]>
      return buildOxlintArgs({ configFile: 'oxlint.config.js', args })
    },
    expect: ['--fix', '-c', 'oxlint.config.js'],
    info: 'buildOxlintArgs includes --fix flag',
  },

  // Test run.js lines 32-33: args.include branch
  {
    fn: () =>
      buildOxlintArgs({
        configFile: 'oxlint.config.js',
        args: {
          include: ['src', 'test'],
        },
      }),
    expect: ['-c', 'oxlint.config.js', 'src', 'test'],
    info: 'buildOxlintArgs includes include paths after config',
  },

  // Test run.js getOxlintBin with MAGIC_LINT_OXLINT_BIN env override
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
    info: 'getOxlintBin respects MAGIC_LINT_OXLINT_BIN env override',
  },
]
