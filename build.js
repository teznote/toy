import render from './md_renderer.js'
import fg from 'fast-glob'
import fs from 'fs-extra'
import yaml from 'js-yaml'
import path from 'node:path'
const $root = process.env.PWD

/**
 * md 파일을 json 파일로 빌드
 */
function build_pages() {
  // define vars
  const pageinfos_old = (() => {
    try {
      return fs.readJSONSync($root + '/src/pageinfo.json')
    } catch(e) {
      return JSON.parse('[]')
    }
  })()
  const mdinfos = fg.globSync($root + '/src/_pages/**/*.md')

  // convert md -> json
  const pageinfos_new = mdinfos.reduce((arr, src) => {
    const {dir, name, ext, base} = path.parse(src)
    const ver = (name.match(/^(\[.*?\])/) || [])[1] 
    if (ver) {
      const pathname = ((dir === $root + '/src/_pages' ? '/' : '/post/') + name.replace(ver, '')).replace(/^\/index$/, '/')
      const old = pageinfos_old.find(x => x.pathname === pathname)
      if (!old || old.ver !== ver) {
        const tar = $root + '/_site/_pages' + (pathname === '/' ? '/index' : pathname) + '.json'
        const json = render(src)
        arr.push({ver, pathname, src, tar, ...json.page})
        
        fs.outputJSONSync(tar, json)
      } else {
        arr.push(old)
      }
    }
    return arr
  }, [])

  // remove json related to deleted md
  for (let old of pageinfos_old) {
    if (!pageinfos_new.find(x => x.pathname === old.pathname)) {
      fs.removeSync(old.tar)
    }
  }

  // update navigation jsons
  const yamlinfos = fg.globSync($root + '/src/_pages/**/*.{yaml,yml}')[0]
  const menus = yaml.load(fs.readFileSync(yamlinfos, 'utf8'))
  for (let [outer, inner] of Object.entries(menus)) {
    const pathname = '/' + outer.toLocaleLowerCase()
    const tar = $root + '/_site/_pages' + pathname + '.json'
    const json = render($root + `/src/_layouts/nav.html`, '', { cats: inner, pages: pageinfos_new })
    // Object.assign(json, { pathname, tar })
    fs.outputJSONSync(tar, json)
  }

  // save new pageinfos to local
  fs.outputJSONSync($root + '/src/pageinfo.json', pageinfos_new)
}

/**
 * main 실행 구문
 */
switch (process.argv[2]) {
  case 'pages':
    build_pages()
    break
}


