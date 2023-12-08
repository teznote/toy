import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import hljs from 'highlight.js'
import { visit } from 'unist-util-visit'


export default defineConfig({
  outDir: './_site',
  trailingSlash: 'never',
  build: {
    inlineStylesheets: `never`,
  },
  markdown: {
    syntaxHighlight: false,
    remarkPlugins: [remarkHighlightjs],
  },
  integrations: [
    mdx({
      syntaxHighlight: false,
      remarkPlugins: [remarkHighlightjs],
    }),
  ],
})


function remarkHighlightjs() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      let { lang, value } = node
      let language = hljs.getLanguage(lang) ? lang : 'plaintext'

      let lines = value.trim().split('\n')
      let tar_line = new Map()
      let code_modified = lines.map((x, i) => {
        if (x[0] === '-' || x[0] === '+' || x[0] === '>') {
          tar_line.set(i, x[0])
          x = x.slice(1)
        }
        return x
      }).join('\n')

      lines = hljs.highlight(code_modified, { language }).value.trim().split('\n')
      node.type = 'html'
      node.value = `<pre><code class="hljs language-${ language }">`
      node.value += lines.map((x, i) => {
        return `<div class="line ${tar_line.get(i) || ''}">${x || ' '}</div>`
      }).join('')
      node.value += `</code></pre>`
    })
  }
}