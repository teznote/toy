import matter from 'gray-matter'
import yaml from 'js-yaml'
import { Liquid } from 'liquidjs'
import hljs from 'highlight.js'
import markdownIt from 'markdown-it'
import { minify } from 'html-minifier'

const matter_opt = { engines: { yaml: s => yaml.load(s, { schema: yaml.JSON_SCHEMA }) } }
const engine = new Liquid()
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
        begin: /[\/|\\▲▶▼◀+-]+/,
      },
    ],
  }
})
const parse_md = markdownIt({
  html: true,
  xhtmlOut: true,
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'

    let lines = code.trim().split('\n')
    let tar_line = new Map()
    let code_modified = lines.map((x, i) => {
      if (x[0] === '-' || x[0] === '+' || x[0] === ']') {
        tar_line.set(i, x[0])
        x = x.slice(1)
      }
      return x
    }).join('\n')

    lines = hljs.highlight(code_modified, { language }).value.trim().split('\n')
    return lines.map((x, i) => {
      return `<div class="codeline ${tar_line.get(i) || ''}">${x || ' '}</div>`
    }).join('')
  },
})

function render(file, content='', props={}) {
  const { layout, ...rest } = props
  props = rest
  const r = matter.read(file, matter_opt)
  if (file.match(/\.md$/)) {
    Object.assign(props, { page: r.data })
    content = parse_md.render(r.content)
  } else {
    Object.assign(props, r.data)
    content = engine.parseAndRenderSync(r.content, { content, ...props })
  }

  if (r.data?.layout) {
    return render(process.env.PWD + `/src/_layouts/${r.data.layout}.html`, content, props)
  } else {
    content = minify(content, { removeComments: true, collapseWhitespace: true })
    return { content, ...props }
  }
}

export default render