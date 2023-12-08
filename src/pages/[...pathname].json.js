const mds = import.meta.glob('../../_pages/**/*.md', { eager: true })

export async function getStaticPaths() {
  return Object.entries(mds).map(md => {
    const pathname = md[0].split('/_pages')[1].replace(/\[.*\]/, '').replace(/\.md$/, '')
    const frontmatter = md[1].frontmatter
    const content = md[1].compiledContent()
    return { params: { pathname }, props: { frontmatter, content } }
  })
}

export const GET = ({ params, props}) => {
  return new Response(
    JSON.stringify({
      pathname: params.pathname,
      frontmatter: props.frontmatter,
      content: `<article class="markdown-body">` + props.content + `</article>`
    }),
  )
}