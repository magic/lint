# @magic/lint

run oxlint and lint your code.

[html docs](https://magic.github.io/lint)

[![NPM version][npm-image]][npm-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]

[npm-image]: https://img.shields.io/npm/v/@magic/lint.svg
[npm-url]: https://www.npmjs.com/package/@magic/lint
[snyk-image]: https://snyk.io/test/npm/@magic/lint/badge.svg
[snyk-url]: https://snyk.io/test/npm/@magic/lint

- [install](#install)
- [usage](#usage)
  - [npm scripts](#npm-scripts)
  - [cli](#usage-cli)
  - [colors](#usage-colors)
  - [configuration](#usage-config)
    - [config resolution order](#config-resolution-order)
    - [environment variables](#environment-variables)
    - [shared config](#usage-shared-config)
      - [ignorePatterns note](#ignore-patterns-note)
      - [shared config rules](#shared-config-rules)
  - [exit codes](#usage-exit-codes)
- [package exports](#package-exports)
- [license](#license)

#### <a name="install"></a>getting started

be in a nodejs project.

```bash
npm i --save-dev --save-exact @magic/lint
```

#### <a name="usage"></a>usage

#### <a name="npm-scripts"></a>npm scripts

```json
"scripts": {
  "lint": "lint"
}
```

Then run:

```bash
npm run lint
# or
npm run lint src
npm run lint -f
```

#### <a name="usage-cli"></a>cli

```
lint [paths]     - lint the given paths, or the current directory
lint -c conf.ts  - lint with the given config
lint -f          - fix as many issues as possible
lint -v          - echo the oxlint command
```

`lint` is a thin wrapper around the [oxlint](https://github.com/oxc-project/oxc)
cli. it spawns oxlint with the resolved config and forwards its output
and exit code.

##### <a name="usage-colors"></a>colors

oxlint only emits colors when its own stdout is a TTY, so piping its
output (which `lint` always does) would lose them. `lint` therefore
decides on color from **its own** stdout and passes the decision to
oxlint via its environment, so `npm run lint` in a terminal shows the
same colored output as running oxlint directly, while
`lint | tee log.txt` stays plain.

the decision respects the standard env vars, in this order of
precedence:

1. `NO_COLOR` (set and non-empty) — no colors, even in a TTY
2. `FORCE_COLOR` (set, not `0`) — colors, even when piped
3. `lint`'s stdout is a TTY — colors
4. `CI` (set and non-empty) — colors, for CI logs
5. otherwise — no colors

#### <a name="usage-config"></a>configuration

your project must have an `oxlint.config.ts` in its root
(`process.cwd()`), allowing you to tailor the rules to your codebase.

a different config can be given explicitly with `--config`.

##### <a name="config-resolution-order"></a>config resolution order

`lint` resolves the config in this order:

1. **explicit `--config` / `-c` flag** — passed through as-is (relative paths resolved against `cwd`)
2. **consumer config** — `oxlint.config.ts` in the current working directory (if it exists)
3. **shared config** — the built-in config from `@magic/lint` (fallback)

this means you can:

- run `lint` with zero config in a new project (uses shared config)
- add `oxlint.config.ts` to your project to customize rules
- run `lint -c my.config.ts` for one-off configs (e.g. CI, sub-projects)

##### <a name="environment-variables"></a>environment variables

| variable                | purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `MAGIC_LINT_OXLINT_BIN` | override the oxlint binary path (for testing or custom builds) |

##### <a name="usage-shared-config"></a>shared config

To customize the shared config, you must **import and re-export** it from your own `oxlint.config.ts`. This is **mandatory** for oxlint to find and apply the correct rules to your files:

```ts
// oxlint.config.ts
import config from '@magic/lint/config'

export default config
```

Without this import/export, oxlint will not pick up your custom configuration and will not find the files correctly. Your project's `oxlint.config.ts` is picked up automatically by the shared config once you re-export it, so no extra wiring is needed.

##### <a name="ignore-patterns-note"></a>⚠️ note on ignorePatterns

When using the shared config, **local `ignorePatterns` in your project's `oxlint.config.ts` do not work** as expected. This is a limitation of how oxlint merges extended configs — ignorePatterns from the base config take precedence, and local patterns are ignored.

**Workaround:** create an `oxlint.config.ts` in your project root that imports and re-exports the shared config directly (instead of using `extends`):

```ts
// oxlint.config.ts
import config from '@magic/lint/config'

export default {
  ...config,
  ignorePatterns: [...config.ignorePatterns, 'src/custom/ignore'],
}
```

Then add your `ignorePatterns` (and any rule overrides) to this file. Since it's a direct re-export, you have full control over the config object.

##### <a name="shared-config-rules"></a>shared config rules

The shared config enables correctness rules as errors:

- **core**: `no-unused-vars`, `no-debugger`, `no-cond-assign`, `no-constant-condition`, `no-empty`, `no-unreachable`, `no-unsafe-negation`, `no-unsafe-optional-chaining`, `constructor-super`, `getter-return`, `no-class-assign`, `no-const-assign`, `no-dupe-class-members`, `no-dupe-keys`, `no-func-assign`, `no-import-assign`, `no-new-native-nonconstructor`, `no-obj-calls`, `no-redeclare`, `no-setter-return`, `no-this-before-super`, `no-unsafe-finally`, `preserve-caught-error`, `require-yield`, `use-isnan`, `valid-typeof`, `no-array-constructor`, `no-unused-expressions`, `curly`, and more
- **typescript**: `ban-ts-comment`, `no-duplicate-enum-values`, `no-empty-object-type`, `no-explicit-any`, `no-extra-non-null-assertion`, `no-misused-new`, `no-namespace`, `no-non-null-asserted-optional-chain`, `no-require-imports`, `no-this-alias`, `no-unnecessary-type-constraint`, `no-unsafe-declaration-merging`, `no-unsafe-function-type`, `no-wrapper-object-types`, `prefer-as-const`, `prefer-namespace-keyword`, `triple-slash-reference`
- **style / misc**: `no-var`, `prefer-const`, `prefer-rest-params`, `prefer-spread` as errors
- **overrides for TS files**: an (empty) override block for `*.ts`, `*.tsx`, `*.mts`, `*.cts` as a placeholder for per-file-type rules

See [`src/oxlint.config.js`](src/oxlint.config.js) for the full rule set.

**named exports** (for advanced use):

```js
import {
  resolveConfig, // resolve config path given args + cwd
  getOxlintBin, // get the oxlint binary path
  runOxlint, // run oxlint with raw args
  colorEnv, // env for oxlint color output, see colors above
  sharedConfigPath, // path to the shared config
  consumerConfigName, // 'oxlint.config.ts'
  config, // content of oxlint.config.ts
} from '@magic/lint'
```

##### `resolveConfig(args, cwd)`

resolves the config file path per the resolution order above.

##### `getOxlintBin()`

returns the path to the oxlint binary. respects `MAGIC_LINT_OXLINT_BIN`.

##### `runOxlint(oxlintArgs, cwd)`

low-level: spawns oxlint with the given argv array. color is decided
via `colorEnv()` (see [colors](#usage-colors)).

##### `colorEnv(env, isTTY)`

computes the env to pass to an oxlint child process for color output:
`FORCE_COLOR=1` when color should be emitted, `NO_COLOR=1` otherwise
(see [colors](#usage-colors)). defaults to the current process's env
and stdout.

##### `sharedConfigPath`

absolute path to this package's `src/oxlint.config.js`.

##### `consumerConfigName`

string `'oxlint.config.ts'` — the filename checked in the consumer project.

##### `config`

reexport of oxlint.config.js

#### <a name="usage-exit-codes"></a>exit codes

- `0` - no issues found
- `1` - lint issues found, or an oxlint error (e.g. no files matched)

#### <a name="package-exports"></a>package exports

| specifier            | provides                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@magic/lint`        | named: `resolveConfig`, `getOxlintBin`, `runOxlint`, `colorEnv`, `sharedConfigPath`, `consumerConfigName`, `config` (shared config object)       |
| `@magic/lint/bin`    | CLI entry point (`src/bin.js`)                                                                                                                   |
| `@magic/lint/config` | the shared oxlint config (import and re-export it from your `oxlint.config.ts`) — **mandatory** for oxlint to find and apply rules to your files |
| `@magic/lint/types`  | TypeScript declarations                                                                                                                          |

#### <a name="license"></a>license

AGPL-3.0 — see [LICENSE](LICENSE) for details.
