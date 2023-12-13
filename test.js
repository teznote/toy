import yaml from 'js-yaml'
import fs from 'fs-extra'

const menu = yaml.load(fs.readFileSync('./src/_pages/navmenu.yaml', 'utf8'))
console.log(menu)
console.log(Object.keys(menu))