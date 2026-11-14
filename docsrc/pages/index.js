export const View = state => [
  h1(state.title),

  state.description.map(d => p(d)),

  h2({ id: 'install' }, 'install'),
  p('be in a nodejs project.'),

  Pre('npm i --save-dev --save-exact @magic/lint'),

  h2({ id: 'usage' }, 'usage'),

  h3({ id: 'usage-npm-scripts' }, 'npm scripts'),

  Pre(`
{
  "scripts": {
    "lint": "lint"
  }
}`),

  p('then run:'),

  Pre(`
npm run lint
npm run lint src
npm run lint -f
  `),

  h3({ id: 'usage-cli' }, 'cli'),

  Pre(`
lint [paths]     - lint the given paths, or the current directory
lint -c conf.ts  - lint with the given config
lint -f          - fix as many issues as possible
lint -v          - echo the oxlint command
  `),

  p(
    'lint is a thin wrapper around the ',
    a({ href: 'https://github.com/oxc-project/oxc' }, 'oxlint'),
    ' cli. it spawns oxlint with the resolved config and forwards its output and exit code.',
  ),

  h3({ id: 'usage-colors' }, 'colors'),

  p(
    'oxlint only emits colors when its own stdout is a TTY, so piping its output (which lint always does) would lose them. lint therefore decides on color from its own stdout and passes the decision to oxlint via its environment, so npm run lint in a terminal shows the same colored output as running oxlint directly, while lint | tee log.txt stays plain.',
  ),

  p('the decision respects the standard env vars, in this order of precedence:'),

  ul([
    li([strong('NO_COLOR'), ' (set and non-empty) — no colors, even in a TTY']),
    li([strong('FORCE_COLOR'), ' (set, not 0) — colors, even when piped']),
    li("lint's stdout is a TTY — colors"),
    li([strong('CI'), ' (set and non-empty) — colors, for CI logs']),
    li('otherwise — no colors'),
  ]),

  h2({ id: 'config' }, 'configuration'),

  p('by default, the config shared by @magic/lint is used (src/oxlint.config.js of this package).'),

  p(
    'if your project has an oxlint.config.ts in its root (process.cwd()), it is used instead, so you can tailor the rules to your codebase.',
  ),

  p('a different config can be given explicitly with --config.'),

  h3({ id: 'config-resolution-order' }, 'config resolution order'),

  p('lint resolves the config in this order:'),

  ul([
    li('explicit --config / -c flag — passed through as-is (relative paths resolved against cwd)'),
    li('consumer config — oxlint.config.ts in the current working directory (if it exists)'),
    li('shared config — the built-in config from @magic/lint (fallback)'),
  ]),

  p('this means you can:'),

  ul([
    li('run lint with zero config in a new project (uses shared config)'),
    li('add oxlint.config.ts to your project to customize rules'),
    li('run lint -c my.config.ts for one-off configs (e.g. CI, sub-projects)'),
  ]),

  h3({ id: 'config-extend' }, 'extending the shared config'),

  p(
    'instead of replacing the shared config, extend it from your own oxlint.config.ts. import the shared config via the /config export and re-export it. this is **mandatory** for oxlint to find and apply the correct rules to your files:',
  ),

  Pre(`
// oxlint.config.ts
import config from '@magic/lint/config'

export default config`),

  p(
    'without this import/export, oxlint will not pick up your custom configuration and will not find the files correctly. your project oxlint.config.ts is picked up automatically by lint once you re-export the shared config, so no extra wiring is needed.',
  ),

  h3({ id: 'environment-variables' }, 'environment variables'),

  ul([
    li([
      strong('MAGIC_LINT_OXLINT_BIN'),
      ' — override the oxlint binary path (for testing or custom builds)',
    ]),
  ]),

  h2({ id: 'usage-js' }, 'javascript api'),

  p('the javascript api provides low-level utilities for running oxlint programmatically:'),

  Pre(`
import {
  resolveConfig,      // resolve config path given args + cwd
  getOxlintBin,       // get the oxlint binary path
  runOxlint,          // run oxlint with raw args
  colorEnv,           // env for oxlint color output, see colors above
  sharedConfigPath,   // path to the shared config
  consumerConfigName, // 'oxlint.config.ts'
  config,             // the shared oxlint config object
} from '@magic/lint'`),

  h3({ id: 'runoxlint' }, 'runOxlint(oxlintArgs, cwd)'),

  p(
    'low-level: spawns oxlint with the given argv array. color is decided via colorEnv(). returns { code, stdout, stderr }.',
  ),

  h3({ id: 'colorenv' }, 'colorEnv(env, isTTY)'),

  p(
    "computes the env to pass to an oxlint child process for color output: FORCE_COLOR=1 when color should be emitted, NO_COLOR=1 otherwise. defaults to the current process's env and stdout.",
  ),

  h3({ id: 'resolveconfig' }, 'resolveConfig(args, cwd)'),

  p('resolves the config file path per the resolution order above.'),

  h3({ id: 'getoxlintbin' }, 'getOxlintBin()'),

  p('returns the path to the oxlint binary. respects MAGIC_LINT_OXLINT_BIN.'),

  h3({ id: 'sharedconfigpath' }, 'sharedConfigPath'),

  p("absolute path to this package's src/oxlint.config.js."),

  h3({ id: 'consumerconfigname' }, 'consumerConfigName'),

  p("string 'oxlint.config.ts' — the filename checked in the consumer project."),

  h3({ id: 'config' }, 'config'),

  p('the shared oxlint config object (default export of oxlint.config.js).'),

  h2({ id: 'exports' }, 'package exports'),

  ul([
    li([
      strong('@magic/lint'),
      ' — named: resolveConfig, getOxlintBin, runOxlint, colorEnv, sharedConfigPath, consumerConfigName, config',
    ]),
    li([strong('@magic/lint/bin'), ' — CLI entry point']),
    li([
      strong('@magic/lint/config'),
      ' — the shared oxlint config (JS module, import and re-export it from your oxlint.config.ts) — **mandatory** for oxlint to find and apply rules to your files',
    ]),
    li([strong('@magic/lint/types'), ' — TypeScript declarations']),
  ]),

  h2({ id: 'exit-codes' }, 'exit codes'),

  ul([
    li([strong('0'), ' — no issues found']),
    li([strong('1'), ' — lint issues found, or an oxlint error (e.g. no files matched)']),
  ]),

  h2({ id: 'license' }, 'license'),

  p(
    'AGPL-3.0 — see ',
    a({ href: 'https://github.com/magic/lint/blob/main/LICENSE' }, 'LICENSE'),
    ' for details.',
  ),
]
