export const state = {
  title: '@magic/lint',
  description: ['run oxlint and lint your code.'],

  logotext: '@magic/lint',
  menu: [
    { to: '#install', text: 'install' },
    {
      to: '/#usage',
      text: 'usage',
      items: [
        { to: '-cli', text: 'cli' },
        { to: '-js', text: 'javascript api' },
      ],
    },
    {
      to: '/#config',
      text: 'configuration',
      items: [{ to: '-extend', text: 'extending shared config' }],
    },
    { to: '/#exports', text: 'package exports' },
    { to: '/#exit-codes', text: 'exit codes' },
  ],
}
