### Changelog

#### 0.0.5

- preserve oxlint colors when piping: pass the color decision (based on
  lint's own stdout and NO_COLOR / FORCE_COLOR / CI) to oxlint via env,
  since oxlint only colors when its own stdout is a TTY
- export `colorEnv` from the main package

#### 0.0.4

- export config from main package, `import { config } from '@magic/lint'`
- update README and docs
- clean up type definitions and migrate tests to TypeScript
- refactor source code and update lint configuration
- remove lint() wrapper and its tests
- drop re-exports from deleted lib/lint.js

#### 0.0.3

- update README
- fix src/oxlint.config.js paths in all files

#### 0.0.2

- rename src/oxlint.config.ts to .js

#### 0.0.1

- first publish
