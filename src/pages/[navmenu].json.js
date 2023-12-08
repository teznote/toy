const component = await import ('../../_pages/navmenu.astro')
// import component from '../../_pages/navmenu.astro'
// const component = import.meta.glob('../../_pages/navmenu.astro', { eager: true })
console.log(component.default({}))



export async function getStaticPaths() {
  return [
    { params: { navmenu: '1' } }
  ]
}

// export const GET = ({ params, props}) => {
//   return new Response(
//     JSON.stringify({
//       pathname: params.pathname,
//       frontmatter: props.frontmatter,
//       content: `<article class="markdown-body">` + props.content + `</article>`
//     }),
//   )
// }