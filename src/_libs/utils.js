import path from 'path'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'

      let lines = code.trim().split('\n')
      let tar_line = new Map()
      let code_modified = lines.map((x, i) => {
        if (x[0] === '-' || x[0] === '+' || x[0] === '>') {
          tar_line.set(i, x[0])
          x = x.slice(1)
        }
        return x
      }).join('\n')

      lines = hljs.highlight(code_modified, { language }).value.trim().split('\n')
      return lines.map((x, i) => {
        return `<div class="line ${tar_line.get(i) || ''}">${x || ' '}</div>`
      }).join('')
    },
  })
)

export function load(filepath) {
  const { root, dir, base, ext, name } = path.parse(filepath)

  switch (ext) {
    case '.md':
      html_to_json(md_to_html(filepath))
      break
  }
}

function md_to_html(filepath) {
  
}

