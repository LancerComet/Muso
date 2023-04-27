import * as path from 'path'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: path.resolve(__dirname, '../lib/index.ts'),

  output: [
    {
      file: path.resolve(__dirname, '../dist/index.js'),
      format: 'umd',
      name: 'Muso'
    },
    {
      file: path.resolve(__dirname, '../dist/index.esm.js'),
      format: 'es'
    }
  ],

  plugins: [
    typescript({
      tsconfigOverride: {
        include: ['./lib']
      }
    })
  ]
}
