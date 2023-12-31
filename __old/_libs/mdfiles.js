import path from 'node:path'

const mdfiles_from_main = await (await fetch('https://api.github.com/repos/teznote/teznote.github.io/git/trees/main?recursive=1')).json()
const mdfiles = mdfiles_from_main.tree?.map(x => {
  if (x.type !== 'tree') {
    const {dir, name, ext, base} = path.parse(x.path)
    if (ext === '.md') {
      const ver = (name.match(/^(\[.*?\])/) || [])[1]
      if (ver) {
        const pathname = ((dir === '' ? '/' : '/post/') + name.replace(ver, '')).replace(/^\/index$/, '/')
        const src = 'https://raw.githubusercontent.com/teznote/teznote.github.io/main/' + base
        const tar = '/_site/_pages' + (pathname === '/' ? '/index' : pathname) + '.json'
        
        return {ver, dir, name, pathname, src, tar}
      }
    }
  }
}).filter(x => x)

export default mdfiles