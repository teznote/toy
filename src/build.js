import fg from 'fast-glob'
import fs from 'fs-extra'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import postcss from 'postcss'
import postcss_nested from 'postcss-nested'
import unocss from '@unocss/postcss'
import cssnano from 'cssnano'
import { Liquid } from 'liquidjs'
import { minify } from 'html-minifier'
import hljs from 'highlight.js'
import markdownIt from 'markdown-it'

// 

// init liquidjs
const engine = new Liquid()

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
        begin: /[↑→↓←\/|\\+-]+/,
      },
    ],
  }
})

// md renderer init and customize for line highlighting
const parse_md = markdownIt({
  html: true,
  xhtmlOut: true,
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

// md file -> json sting convert recursive function
function convert(file, content='', props={}) {
  props.layout = null
  const r = matter.read(file, {
    engines: { yaml: s => yaml.safeLoad(s, { schema: yaml.JSON_SCHEMA }) }
  })
  Object(props, r.data)
  if (file.match(/\.md$/)) {
    content = parse_md.render(r.content)
  } else {
    content = engine.parseAndRenderSync(r.content, { content, ...props })
  }
  return (r.data?.layout) ? convert(`./_layouts/${r.data.layout}.html`, content, ...props) : { content, ...props } 
}

// build _pages
function build_pages() {
  const mdfiles = fg.globSync('./_pages/**/*.md')
  const mdinfos = []

  for (let mdfile of mdfiles) {
    const { content, title } = convert(mdfile)
    const pathname = mdfile.split('/_pages')[1].replace(/\[.*?\]/, '').replace(/\.md$/, '')

  }
}