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

  h2({ id: 'config' }, 'configuration'),

  p('by default, the config shared by @magic/lint is used (src/oxlint.config.ts of this package).'),

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
    li(
      strong('MAGIC_LINT_OXLINT_BIN') +
        ' — override the oxlint binary path (for testing or custom builds)',
    ),
  ]),

  h2({ id: 'usage-js' }, 'javascript api'),

  Pre(`
import { lint } from '@magic/lint'

const { code, stdout, stderr } = await lint({
  // paths to lint. defaults to process.cwd()
  paths: ['src'],
  // path to a custom config file.
  // defaults to process.cwd()/oxlint.config.ts, or the shared config
  config: 'oxlint.config.ts',
  // fix as many issues as possible
  fix: false,
  // working directory. defaults to process.cwd()
  cwd: process.cwd(),
})`),

  p('named exports (for advanced use):'),

  Pre(`
import {
  lint,
  resolveConfig,      // resolve config path given args + cwd
  getOxlintBin,       // get the oxlint binary path
  runOxlint,          // run oxlint with raw args
  sharedConfigPath,   // path to the shared config
  consumerConfigName, // 'oxlint.config.ts'
  config,             // reexport of oxlint.config.ts
} from '@magic/lint'`),

  h3({ id: 'lint-args' }, 'lint(args)'),

  p('main entry point. returns an object with `code`, `stdout`, and `stderr` properties.'),

  ul([
    li([strong('paths'), ': string | string[] — default [cwd] — files/dirs to lint']),
    li([strong('config'), ': string — default auto-resolved — explicit config file']),
    li([strong('fix'), ': boolean — default false — auto-fix issues']),
    li([strong('cwd'), ': string — default process.cwd() — working directory']),
  ]),

  h2({ id: 'exports' }, 'package exports'),

  ul([
    li([
      strong('@magic/lint'),
      ' — default: lint; named: lint, resolveConfig, getOxlintBin, runOxlint, sharedConfigPath, consumerConfigName',
    ]),
    li([strong('@magic/lint/bin'), ' — CLI entry point']),
    li([
      strong('@magic/lint/config'),
      ' — the shared oxlint config (TS module, import and re-export it from your oxlint.config.ts) — **mandatory** for oxlint to find and apply rules to your files',
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
