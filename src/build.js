import fg from 'fast-glob'
import fs from 'fs-extra'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import postcss from 'postcss'
import postcss_nested from 'postcss-nested'
import unocss from '@unocss/postcss'
import cssnano from 'cssnano'
import { Liquid } from 'liquidjs'
// import { minify } from 'html-minifier'
import hljs from 'highlight.js'
import markdownIt from 'markdown-it'

// variables
const $root = process.env.PWD

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
  const { layout, ...rest } = props
  props = rest
  const r = matter.read(file, {
    engines: { yaml: s => yaml.load(s, { schema: yaml.JSON_SCHEMA }) }
  })
  if (file.match(/\.md$/)) {
    content = parse_md.render(r.content)
    Object.assign(props, { page: { ...r.data } })
  } else {
    content = engine.parseAndRenderSync(r.content, { content, ...props })
    Object.assign(props, r.data)
  }
  console.log(props)
  return (r.data?.layout) ? convert($root + `/src/_layouts/${r.data.layout}.html`, content, props) : { content, ...props } 
}

// build post and navigation pages
function build_pages() {
  // remove previous all posts (if exist)
  fs.removeSync($root + '/_site/_pages')

  // generate posts (include index, 404)
  const mdfiles = fg.globSync($root + '/src/_pages/**/*.md')
  const mdinfos = []
  for (let mdfile of mdfiles) {
    const { content, title, description, updated } = convert(mdfile)
    const tmp = mdfile.split('/_pages')[1].replace(/\[.*?\]/, '').replace(/\.md$/, '').split('/')
    

    const tarjson = $root + `/_site/_pages/post/` + pathname.split('/').slice(-1)[0] + '.json'
    fs.outputJSONSync(tarjson, { pathname, content })
    
    const cat = mdfine.match(/\/_pages\/([\S]+)\//)[1])
    mdinfos.push({ pathname, title, description, updated })
  }

  // generate navigation
  const yamlfile = fg.globSync($root + '/src/_pages/**/*.{yaml,yml}')[0]
  const menu = yaml.load(fs.readFileSync(yamlfile, 'utf8'))
  for (let [outer, inner] of Object.entries(menu)) {
    const { content } = convert($root + `/src/_layuts/nav.html`, '', { cats: { ...inner }, pages: { ...mdinfos }})
    const pathname = '/' + outer.toLocaleLowerCase()
  }
}

const a = '/home/teznote/toy/src/_pages/excel_formula/[xx]aaa.md'
console.log(a.match(/\/_pages\/([\S]+)\//)[1])