import path from 'node:path'
import yaml from 'js-yaml'
import fg from 'fast-glob'
import fs from 'fs-extra'
import matter from 'gray-matter'
import { Liquid } from 'liquidjs'
import hljs from 'highlight.js'
import markdownIt from 'markdown-it'
import { minify } from 'html-minifier'

/**
 * init global vars and settings
 */
const $root = process.env.PWD
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

const render = (file, content='', props={}) => {
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
    return render(process.env.PWD + `/_layouts/${r.data.layout}.html`, content, props)
  } else {
    content = minify(content, { removeComments: true, collapseWhitespace: true })
    return { content, ...props }
  }
}

/**
 * clear output directory
 */
fs.removeSync($root + '/_site')

/**
 * load markdown files -> convert to json files
 * create pageinfos array for rendering navigation
 */
const mdinfos = fg.globSync($root + '/_pages/**/*.md')
const pageinfos = []
for (let src of mdinfos) {
  const { dir, name } = path.parse(src)
  const tmp_ = (dir === $root + '/_pages' ? '/' : '/post/') + name.replace(/\[.*?\]/, '')
  const tar = $root + '/_site/_pages' + tmp_ + '.json'
  const pathname = tmp_.replace(/^\/index$/, '/')
  const { content, page } = render(src)
  Object.assign(page, { cat: dir.replace($root + '/_pages', '') })
  pageinfos.push({ page, pathname })
  // fs.outputJSONSync(tar, { content, page, pathname })
}

/**
 * load yaml file -> render navigation using yaml data and pageinfos -> convert to json files
 */
const navmenu = yaml.load(fs.readFileSync(fg.globSync($root + '/_pages/**/*.{yaml,yml}')[0], 'utf8'))
for (let [sup, sub] of Object.entries(navmenu)) {
  const { content } = render($root + '/_layouts/nav.html', '', { cats: sub, pages: pageinfos })
  const pathname = '/' + sup.toLocaleLowerCase()
  const tar = $root + '/_site/_pages' + pathname + '.json'
  fs.outputJSONSync(tar, { pathname, page: { title: sup.toLocaleLowerCase() + ' 카테고리' }, content })
}

// console.log(pageinfos)