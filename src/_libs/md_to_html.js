import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

// highlight.js custom language "pseudo"
hljs.registerLanguage("pseudo", function(hljs) {
  return {
    aliases: ['ps'],
    contains: [
      {
        className: 'comment',
        begin: /#/,
        end: /\s\s|\n|$/,
      },
      {
        className: 'strong',
        begin: /\b[A-Z][A-Z0-9]*\b/,
      },
      {
        className: 'number',
        begin: /\b[0-9]+\b/,
      },
      {
        className: 'leadline',
        begin: /[─│┌┐┘└├┬┤┴┼▲▶▼◀↑→↓←]+/,
      },
    ],
  }
})

// md renderer customizing for line highlight
const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'

      let lines = code.trim().split('\n')
      let tar_line = new Map()
      let code_modified = lines.map((x, i) => {
        if (x[0] === '-' || x[0] === '+' || x[0] === '~') {
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

// export module
export default function md_to_html(content) {
  return marked.parse(content)
}