import path from 'node:path'
import yaml from 'js-yaml'
import fg from 'fast-glob'
import fs from 'fs-extra'
import matter from 'gray-matter'
import { Liquid } from 'liquidjs'
import hljs from 'highlight.js'
import markdownIt from 'markdown-it'
import { minify } from 'html-minifier'
import postcss from 'postcss'
import postcss_nested from 'postcss-nested'
import unocss from '@unocss/postcss'
import cssnano from 'cssnano'


// global settings
const $root = '.'
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
    Object.assign(props, { page: r.data, layout: 'page' })
    content = parse_md.render(r.content)
  } else {
    Object.assign(props, r.data)
    content = engine.parseAndRenderSync(r.content, { content, ...props })
  }

  if (props?.layout) {
    return render($root + '/_layouts/' + props.layout + '.html', content, props)
  } else {
    content = minify(content, { removeComments: true, collapseWhitespace: true })
    return { content, ...props }
  }
}


// init output site
fs.removeSync($root + '/_site')


// render post pages
const mdsrcs = fg.globSync($root + '/_pages/**/*.md')
const pageinfos = []
for (let src of mdsrcs) {
  const { dir, name } = path.parse(src)
  const cat = dir.replace($root + '/_pages', '') 
  const tar = $root + '/_site/_pages' + (cat ? '/post/' : '/' ) + name.replace(/^(\[.*?\])/, '') + '.json'
  const pathname = ((cat ? '/post/' : '/' ) + name.replace(/^(\[.*?\])/, '')).replace(/^\/index$/, '/')
  const { content, page } = render(src)
  pageinfos.push({ pathname, cat, ...page })
  fs.outputJSONSync(tar, { pathname, cat, ...page, content })
}


// render navigation pages
const navmenu = yaml.load(fs.readFileSync(fg.globSync($root + '/_pages/**/*.{yaml,yml}')[0], 'utf8'))
for (let [sup, sub] of Object.entries(navmenu)) {
  const { content } = render($root + '/_layouts/nav.html', '', { cats: sub, pages: pageinfos })
  const pathname = '/' + sup.toLocaleLowerCase()
  const tar = $root + '/_site/_pages' + pathname + '.json'
  fs.outputJSONSync(tar, { pathname, page: { title: sup.toLocaleLowerCase() + ' 카테고리' }, content })
}


// render index.html, 404.html
const menus = Object.keys(navmenu).map(sup => {
  return { pathname: '/' + sup.toLocaleLowerCase(), title: sup }
})
const { content } = render($root + '/_layouts/base.html', '', { menus })
fs.outputFileSync($root + '/_site/index.html', content)
fs.copyFileSync($root + '/_site/index.html', $root + '/_site/404.html')


// copy static assets
fs.copySync($root + '/_assets', $root + '/_site/_assets', {
  filter: (from, to) => {
    return !from.includes('main.css')
  }
})


// render main.css
postcss([ postcss_nested, unocss, cssnano ]).process(
  fs.readFileSync($root + '/_assets/main.css', 'utf-8'), {
    from: $root + '/_assets/main.css',
    to: $root + '/_site/_assets/main.css',
  }
).then(css => {
  fs.outputFileSync(css.opts.to, css.css)
})


