import { buildOxlintArgs, colorEnv, getOxlintBin } from '../../src/lib/run.js'

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
    expect: [
      '--ignore-pattern',
      '*.test.ts',
      '--ignore-pattern',
      '*.spec.ts',
      '-c',
      'oxlint.config.js',
    ],
    info: 'buildOxlintArgs includes --ignore-pattern for each exclude pattern',
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

  // Test run.js: paths branch
  {
    fn: () =>
      buildOxlintArgs({
        configFile: 'oxlint.config.js',
        paths: ['src', 'test'],
      }),
    expect: ['-c', 'oxlint.config.js', 'src', 'test'],
    info: 'buildOxlintArgs includes positional paths after config',
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

  // colorEnv: TTY stdout -> force color on the oxlint child process
  {
    fn: () => colorEnv({}, true),
    expect: { FORCE_COLOR: '1' },
    info: 'colorEnv forces color when stdout is a TTY',
  },

  // colorEnv: non-TTY stdout and no color env -> force color off
  {
    fn: () => colorEnv({}, false),
    expect: { NO_COLOR: '1' },
    info: 'colorEnv disables color when stdout is not a TTY',
  },

  // colorEnv: explicit FORCE_COLOR wins over non-TTY and is normalized to '1'
  {
    fn: () => colorEnv({ FORCE_COLOR: 'true' }, false),
    expect: { FORCE_COLOR: '1' },
    info: 'colorEnv normalizes an explicit FORCE_COLOR to 1 even without a TTY',
  },

  // colorEnv: FORCE_COLOR=0 is treated as unset
  {
    fn: () => colorEnv({ FORCE_COLOR: '0' }, false),
    expect: { NO_COLOR: '1' },
    info: 'colorEnv treats FORCE_COLOR=0 as unset',
  },

  // colorEnv: NO_COLOR wins over a TTY
  {
    fn: () => colorEnv({ NO_COLOR: '1' }, true),
    expect: { NO_COLOR: '1' },
    info: 'colorEnv: NO_COLOR wins over a TTY',
  },

  // colorEnv: NO_COLOR wins over FORCE_COLOR, which is stripped
  {
    fn: () => colorEnv({ NO_COLOR: '1', FORCE_COLOR: '1' }, true),
    expect: { NO_COLOR: '1' },
    info: 'colorEnv: NO_COLOR wins over FORCE_COLOR and strips it',
  },

  // colorEnv: CI implies color on non-TTY, replaced by FORCE_COLOR
  {
    fn: () => colorEnv({ CI: 'true' }, false),
    expect: { FORCE_COLOR: '1' },
    info: 'colorEnv: CI implies color and is replaced by FORCE_COLOR',
  },

  // colorEnv: NO_COLOR wins over CI, which is stripped
  {
    fn: () => colorEnv({ NO_COLOR: '1', CI: 'true' }, false),
    expect: { NO_COLOR: '1' },
    info: 'colorEnv: NO_COLOR wins over CI and strips it',
  },

  // colorEnv: an empty NO_COLOR is treated as unset
  {
    fn: () => colorEnv({ NO_COLOR: '' }, true),
    expect: { FORCE_COLOR: '1' },
    info: 'colorEnv treats an empty NO_COLOR as unset',
  },

  // colorEnv: unrelated env vars are passed through untouched
  {
    fn: () => colorEnv({ PATH: '/bin' }, false),
    expect: { PATH: '/bin', NO_COLOR: '1' },
    info: 'colorEnv passes through unrelated env vars',
  },
]
