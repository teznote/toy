import html from 'rollup-plugin-generate-html-template'
import browsersync from 'rollup-plugin-browsersync'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import mdx from '@mdx-js/rollup'
import babel_jsx from '@babel/plugin-syntax-jsx'

export default {
  input: 'test.js',
  output: {
    file: 'dist/test.js',
    format: 'umd',
  },
  plugins: [
    html({
      template: 'index.html',
      target: 'dist/index.html',
    }),
    browsersync({
      server: 'dist',
    }),
    resolve(),
    commonjs({
      include: 'node_modules/**',
    }),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx', '.cjs', '.mjs', '.md', '.mdx'],
    }),
    // babel_jsx(),
    mdx({})
  ]
}