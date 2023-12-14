import fg from 'fast-glob'
import fs from 'fs-extra'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import postcss from 'postcss'
import postcss_nested from 'postcss-nested'
import unocss from '@unocss/postcss'
import cssnano from 'cssnano'
import { Liquid } from 'liquidjs'
import hljs from 'highlight.js'
import markdownIt from 'markdown-it'
import posthtml from 'posthtml'
import htmlnano from 'htmlnano'

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
        begin: /[\/|\\▲▶▼◀+-]+/,
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

// miscellaneous global variables
const $root = process.env.PWD

// md file -> json sting convert recursive function
function convert(file, content='', props={}) {
  const { layout, ...rest } = props
  props = rest
  const r = matter.read(file, {
    engines: { yaml: s => yaml.load(s, { schema: yaml.JSON_SCHEMA }) }
  })
  if (file.match(/\.md$/)) {
    Object.assign(props, { page: { ...r.data } })
    content = parse_md.render(r.content)
  } else {
    Object.assign(props, r.data)
    content = engine.parseAndRenderSync(r.content, { content, ...props })
  }
  return (r.data?.layout) ? convert($root + `/src/_layouts/${r.data.layout}.html`, content, props) : { content, ...props } 
}

// remove previous all blog sources (if exist)
function gen_init() {
  fs.removeSync($root + '/_site')
}

// generate posts and pages (include index, 404, navigation, layouts)
async function gen_pages() {
  // gen posts, index, 404
  const mdfiles = fg.globSync($root + '/src/_pages/**/*.md')
  const mdinfos = []
  for (let mdfile of mdfiles) {
    const { content, page } = convert(mdfile)
    const tmp = mdfile.split('/_pages')[1].replace(/\[.*?\]/, '').replace(/\.md$/, '').match(/(\S*)\/(\S*)/)
    const cat = tmp[1]
    const pathname = (cat ? '/post/' : '/') + tmp[2]

    const content_minified = await posthtml([htmlnano()]).process(content)

    const tarjson = $root + '/_site/_pages' + pathname + '.json'
    fs.outputJSONSync(tarjson, { pathname, cat, page, content: content_minified.html })

    mdinfos.push({ pathname, cat, ...page })
  }
  
  // gen navigation
  const yamlfile = fg.globSync($root + '/src/_pages/**/*.{yaml,yml}')[0]
  const menu = yaml.load(fs.readFileSync(yamlfile, 'utf8'))
  for (let [outer, inner] of Object.entries(menu)) {
    const { content } = convert($root + `/src/_layouts/nav.html`, '', { cats: inner, pages: mdinfos })
    const pathname = '/' + outer.toLocaleLowerCase()

    const content_minified = await posthtml([htmlnano()]).process(content)

    const tarjson = $root + '/_site/_pages' + pathname + '.json'
    fs.outputJSONSync(tarjson, { pathname, titie: outer.toLocaleLowerCase() + ' 카테고리', content: content_minified.html })
  }

  // gen layout
  const menus = Object.keys(menu).map(outer => {
    return { pathname: '/' + outer.toLocaleLowerCase(), title: outer[0].toLocaleUpperCase() + outer.slice(1) }
  })
  {
    const { content } = convert($root + `/src/_layouts/base.html`, '', { menus })
    const content_minified = await posthtml([htmlnano()]).process(content)

    const tarjson = $root + '/_site/index.html'
    fs.outputFileSync(tarjson, content_minified.html)
    fs.copyFileSync(tarjson, $root + '/_site/404.html')
  }
}

// generate css and copy another static files (like favicon, js files)
async function gen_assets() {
  fs.copySync($root + '/src/_assets', $root + '/_site/_assets', {
    filter: (from, to) => {
      return !from.includes('main.css')
    }
  })

  const src_css = fs.readFileSync($root + '/src/_assets/main.css')
  const generated_css = await postcss(
    [postcss_nested, unocss, cssnano]
  ).process(src_css, {
    from: $root + '/src/_assets/main.css',
    to: $root + '/_site/_assets/main.css',
  })
  fs.outputFileSync(generated_css.opts.to, generated_css.css)
}

gen_init()
gen_pages()
gen_assets()