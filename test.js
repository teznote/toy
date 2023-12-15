import path from 'node:path'

const mdfiles_repo_src = (await fetch('https://api.github.com/repos/teznote/teznote.github.io/git/trees/main?recursive=1')).json()

const mdfiles = mdfiles_repo_src.tree?.map(x => {
  if (x.type !== 'tree') {
    const { name, ext } = path.parse(x.path)
    if (ext === '.md') {
      const ver = (name.match(/^(\[.*?\])/) || [])[1]
      if (ver) {
        return {
          ver,
          pathname: '/' + name.replace(ver, ''),
          src: '/src/_pages/' + x.base,
          tar: '/_site/_pages/' + name + '.json'
        }
      }
    }
  }
  const ver = (x.path.match(/^.*\/(\[.*?\])/) || [])[1] ?? ''
  const src = '/' + x.path
  const tar = '/_pages/' + x.path.replace(ver, '').replace(/\.$/)
 
  return {
    ver: 
    pathname: '/' + x.path.replace()
  }
})

// console.log(path.parse('/excel-formula/[index,match,small,0010-2311251358]excel-formula-for-sort-items.md'))
// {
//   root: '/',
//   dir: '/excel-formula',
//   base: '[index,match,small,0010-2311251358]excel-formula-for-sort-items.md',
//   ext: '.md',
//   name: '[index,match,small,0010-2311251358]excel-formula-for-sort-items'
// }