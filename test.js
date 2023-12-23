import render from './md_renderer.js'
import fg from 'fast-glob'
import fs from 'fs-extra'
import path from 'node:path'
const $root = process.env.PWD


const mdinfos = fg.globSync($root + '/src/_pages/**/*.md')
for (let x of mdinfos) {
  console.log(path.parse(x))
}