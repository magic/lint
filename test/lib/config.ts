import { resolveConfig } from '../../src/lib/config.js'

export default [
  // Test config.js line 34: args.config branch (absolute path)
  {
    fn: () => resolveConfig({ config: '/absolute/path/config.ts' }, '/some/path'),
    expect: '/absolute/path/config.ts',
    info: 'resolveConfig returns absolute path when args.config is absolute',
  },

  // Test config.js line 34: args.config branch (relative path)
  {
    fn: () => resolveConfig({ config: './relative/config.ts' }, '/some/path'),
    expect: '/some/path/relative/config.ts',
    info: 'resolveConfig returns joined path when args.config is relative',
  },
]
