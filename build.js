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


/**
 * 글로벌 변수 초기화, 각 모듈 초기 세팅
 */
const $root = '.'
const pageinfos_old = (() => {
  try {
    return fs.readJSONSync($root + '/pageinfos.json')
  } catch (e) {
    return []
  }
})()
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


/**
 * 페이지 빌드(markdown -> html -> json) 함수
 */
const build_pages = () => {
  const mdsrcs = fg.globSync($root + '/_pages/**/*.md')
  const pageinfos_new = []

  // 파일 이름에 ver 있으면서, pageinfos_old 에 없거나(새로 생성된 markdown), ver 달라졌을 경우(업데이트된 markdown)만 렌더링
  for (let src of mdsrcs) {
    const { dir, name } = path.parse(src)
    const ver = (name.match(/^(\[.*?\])/) || [])[1]
    if (ver) {
      const cat = dir.replace($root + '/_pages', '') 
      const tar = $root + '/_site/_pages' + (cat ? '/post/' : '/' ) + name.replace(ver, '') + '.json'
      const pathname = ((cat ? '/post/' : '/' ) + name.replace(ver, '')).replace(/^\/index$/, '/')
      
      const exist = pageinfos_old.find(x => x.pathname === pathname)
      if (!exist || exist.ver !== ver) {
        const { content, page } = render(src)
        pageinfos_new.push({ pathname, cat, ver, ...page, src, tar })
        fs.outputJSONSync(tar, { pathname, cat, ...page, content })
      } else {
        pageinfos_new.push(exist)
      }
    }
  }

  // pageinfos_old 에는 있으나, pageinfos_new 에는 없는 경우(삭제된 markdown) json 삭제
  for (let old of pageinfos_old) {
    if (!pageinfos_new.find(x => x.pathname === old.pathname)) {
      fs.removeSync(x.tar)
    }
  }

  // 첫번째 yaml 파일 로드 -> 로드한 오브젝트와 pageinfos_new 를 사용하여 네비게이션 json 생성
  const navmenu = yaml.load(fs.readFileSync(fg.globSync($root + '/_pages/**/*.{yaml,yml}')[0], 'utf8'))
  for (let [sup, sub] of Object.entries(navmenu)) {
    const { content } = render($root + '/_layouts/nav.html', '', { cats: sub, pages: pageinfos_new })
    const pathname = '/' + sup.toLocaleLowerCase()
    const tar = $root + '/_site/_pages' + pathname + '.json'
    fs.outputJSONSync(tar, { pathname, page: { title: sup.toLocaleLowerCase() + ' 카테고리' }, content })
  }

  // index.html, 404.html 파일 생성
  {
    const menus = Object.keys(navmenu).map(sup => {
      return { pathname: '/' + sup.toLocaleLowerCase(), title: sup }
    })
    const { content } = render($root + '/_layouts/base.html', '', { menus })
    fs.outputFileSync($root + '/_site/index.html', content)
    fs.copyFileSync($root + '/_site/index.html', $root + '/_site/404.html')
  }

  // pageinfos_new 배열을 pageinfos.json 으로 저장
  fs.outputJSONSync($root + '/pageinfos.json', pageinfos_new)
}


/**
 * asset (css, js, static files) 빌드  함수
 */
const build_assets = async () => {
  // copy assets except main.css
  fs.copySync($root + '/_assets', $root + '/_site/_assets', {
    filter: (from, to) => {
      return !from.includes('main.css')
    }
  })

  // build main.css
  const css = await postcss(
    [ postcss_nested, unocss, cssnano ]
  ).process(fs.readFileSync($root + '/_assets/main.css', 'utf-8'), {
    from: $root + '/_assets/main.css',
    to: $root + '/_site/_assets/main.css',
  })
  fs.outputFileSync(css.opts.to, css.css)
}

switch (process.argv[2]) {
  case 'pages':
    build_pages()
    break
  case 'assets':
    build_assets()
    break
  case 'all':
    fs.removeSync($root + '/pageinfos.json')
    build_pages()
    build_assets()
    break
}