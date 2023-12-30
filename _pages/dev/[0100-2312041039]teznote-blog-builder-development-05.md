---
title: Tez'Note 블로그 빌더 개발노트 05 - 빌드 스크립트 작성
description: 블로그 빌드의 가장 핵심적인 부분인 markdown -> html -> json 으로 변환하는 과정 
updated: 2023-12-04
---

## 마크다운 형식

[Jekyll](http://jekyllrb-ko.github.io/) 을 오랫동안 사용했던 관계로, Jekyll 에서 사용하는 마크다운 형태를 유사하게 사용해보고자 했다.

Jekyll 의 마크다운 파일은 `YYYY-MM-DD-파일명.md` 와 같은 형태다. 그리고 파일 내부는 프론트매터를 포함하고 있으며, 어떤 레이아웃으로 마크다운 파싱 결과를 감쌀지를 `layout` 으로 지시하게 되어 있다.

그리고 레이아웃 템플릿은 [Liquid](https://shopify.github.io/liquid/) 을 사용하는데, 이 역시 프론트매터를 포함하고 있고, 상위 템플릿은 프론트매터에서 `layout` 으로, 하위 콘텐츠의 내용은 `{{ content }}` 지시자로 받도록 되어 있다.

Tez'Note 블로그 마크다운파일 형식을 `[파일버전]파일명.md` 로 하기로 했다. `파일버전`이 수정되었을 때만 빌드되도록 했으며, `파일버전`에 따라 정렬이 되도록 했다. Jekyll 은 날짜 형식을 지켜야했지만 파일명이 허용하는 문자는 모두 받아들일 수 있도록 한 셈이다.

## 마크다운 빌드 스크립트

`build.js` 파일을 열어서 아래 내용들을 이어서 작성했다.

먼저 [LiquidJS](https://liquidjs.com/) 템플릿 엔진을 초기화 하는 구문을 삽입한다.

```js
const engine = new Liquid()
```

이제 실제 빌드를 크게 함수를 작성해야하는데, 크게 3 부분으로 나누었다. 마크다운을 빌드하는 `build_md`, 웹페이지 껍데기를 빌드하는 `build_layout`, css 를 빌드하고 static 파일들을 처리하기 위한 `build_assets` 함수가 그것인데, 각각은 `_pages`, `_layouts`, `_assets` 폴더를 빌드한다고 보면 된다.

```js
function build_md() {
  // 로컬에 있는 마크다운 파일들과
  // 마크다운 파일들의 메타데이터를 담고 있는 pageinfo.json 파일을 로딩하여 pageinfo_old 에 연결 
  const src_mds = fg.globSync('./_pages/**/*.md')
  if (!fs.existsSync('./_pages/pageinfo.json')) {
    fs.outputJSONSync('./_pages/pageinfo.json', [])
  }
  const pageinfo_old = fs.readJSONSync('./_pages/pageinfo.json')
  const pageinfo_new = []

  // 마크다운 파일을 모두 순회
  // 파일버전 (ver) 있는 마크다운 중에서,
  // 기존 pageinfo_old 에 없거나 (신규 생성된 마크다운),
  // 기존 pageinfo_old 에 있음에도 파일버전이 달라진 마크다운 (업데이트된 마크다운) 만 json 변환
  // 모든 마크다운 (변환되지 않은 마크다운 포함) 의 메터데이터를 pageinfo_new 에 저장
  for (let src_md of src_mds) {
    const ver = (src_md.match(/\[.*?\]/g) || [''])[0]
    const pathname = src_md.replace(ver, '').replace(/\.md$/, '').replace('./_pages/', '/').replace(/^\/index$/, '/')
    const exist_md = pageinfo_old.find(x => x.pathname === pathname)
    if (ver && (!exist_md || exist_md.ver !== ver)) {
>      let { content, page } = (function fn(file, content, page) {
>        let r = matter.read(file, {
>          engines: {yaml: s => yaml.safeLoad(s, { schema: yaml.JSON_SCHEMA })}
>        })
>        if (file.match(/\.md$/)) {
>          content = md.render(r.content)
>          Object.assign(page, r.data)
>          return ('layout' in r.data) ? fn(`./_layouts/${r.data.layout}.html`, content, page) : { content, page }
>        } else {
>          content = engine.parseAndRenderSync(r.content, { content, page, ...r.data })
>          return ('layout' in r.data) ? fn(`./_layouts/${r.data.layout}.html`, content, page) : { content, page }
>        }
>      })(src_md, '', { pathname })

      content = minify(content, { collapseWhitespace: true })
      const tar_json = './docs' + (pathname === '/' ? '/index' : pathname) + '.json'
      fs.outputJSONSync(tar_json, { pathname, ver, content })
      pageinfo_new.push({ pathname, ver, ...page, tar_json, src_md })
    } else {
      pageinfo_new.push(exist_md)
    }
  }

  // 전체 포스팅을 나열하는 네비게이션 페이지 json 파일 생성
  (function gen_nav(pages) {
    const pathname = '/posts'
    let r = matter.read('./_layouts/nav.html', {
      engines: {yaml: s => yaml.safeLoad(s, { schema: yaml.JSON_SCHEMA })}
    })
    let content = engine.parseAndRenderSync(r.content, { pages, ...r.data })
    content = minify(content, { collapseWhitespace: true })
    fs.outputJSONSync('./docs/posts.json', { pathname, content })
  })(pageinfo_new)

  // pageinfo_old 에는 있었지만 pageinfo_new 에는 없는 마크다운의 경우 (삭제된 마크다운)
  // json 파일 삭제, 만일 이로인해 빈 폴더가 된 경우 해당 폴더도 삭제
  for (const { pathname, tar_json } of pageinfo_old) {
    const exist_md = pageinfo_new.find(x => x.pathname === pathname)
    if (!exist_md) {
      fs.removeSync(tar_json)
      const old_dir = tar_json.match(/^.*(?=\/)/g)[0]
      if (!fs.readdirSync(old_dir).length) {
        fs.removeSync(old_dir)
      }
    }
  }

  // pageinfo_new 에 담긴 메타데이터를 새로운 pageinfo.json 파일로 기록
  fs.outputJSONSync('./_pages/pageinfo.json', pageinfo_new)
}
```

코드가 길지만 주요한 부분은 주석으로 하여 무엇을 하는지 설명했으니 참고해보면 된다.

위에서 라인강조가 된 부분이 핵심으로, 전체 마크다운 파일 순회를 통해, 마크다운 -> html -> json 으로 변환하는 과정을 담고 있는데, 재귀함수를 IIFE 로 구현해서 복잡하기는 하지만 차근차근 구문을 보면 이해가 될 것이다.

`src_md` 파일은 마크다운 소스의 경로 위치를 담고 있는 string 으로, 이와 함께 `{{ content }}` 템플릿 지시자가 받을 내용과, 해당 마크다운의 인터넷 주소에 해당하는 `pathname` 을 인수로 넘긴다.

함수 내부에서 `matter` 오브젝트가 우선 프론트매터와 실제 콘텐츠를 분리하고, 콘텐츠가 마크다운이었다면 `md` 오프젝트가, 아니라면 `engine` 오브젝트가 파싱한다. 그리고 프론트매터에 `layout` 이 있다면 이를 다시 `content` 에 담아서 재귀호출을 하고, 없다면 최종 리턴하도록 했다.

전체 마크다운을 순회한 뒤, `pageinfo.json` 파일이 새롭게 만들어 지면, 이를 가지고 전체 네이게이션 페이지에 해당하는 json 을 생성하고, 다음으로 더 이상 필요가 없는 json 을 삭제하도록 한뒤, 새로운 메타데이터들을 로컬에 저장하는 식으로 작동하도록 했다.

참고로, 각 포스팅에 해당하는 레이아웃인 `page.html` 과 네이게이션 페이지에 해당하는 레이아웃인 `nav.html` 은 html 코드만 더 추가된 형태이므로 굳이 여기에서 자세히 언급하지는 않겠다.

## 웹페이지 빌드 스크립트

위에서는 포스팅과 네비게이션을 빌드한 스크립트였고, 이제 웹페이지 껍데기를 빌드하는 스크립트를 작성한다.

```js
function build_layout() {
  let r = matter.read('./_layouts/base.html', {
    engines: {yaml: s => yaml.safeLoad(s, { schema: yaml.JSON_SCHEMA })}
  })
  let content = engine.parseAndRenderSync(r.content, { ...r.data })
  content = minify(content, { collapseWhitespace: true })
  fs.outputFileSync('./docs/index.html', content)
  fs.copyFileSync('./docs/index.html', './docs/404.html')
}
```

제일 아래 구문을 보면, 앞선 포스팅에서 언급했던 대로 `index.html` 를 생성한 다음, 이를 `404.html` 으로 복사하는 구문이 있음을 눈여겨 볼 수 있다.

## css 빌드 및 static 요소 처리 스크립트

```js
async function build_asset() {
  const src_dir = './_assets'
  const tar_dir = './docs'

  fs.ensureDirSync(src_dir)
  fs.copySync(src_dir, tar_dir, {
    filter: (from, to) => {
      return !from.includes('/main.css')
    }
  })

  fs.ensureFileSync(src_dir + '/main.css')
  const css_o = fs.readFileSync(src_dir + '/main.css')
  const postcss_opt = {from: src_dir + '/main.css', to: tar_dir + '/main.css'}

  const r = await postcss([postcss_nested, unocss, cssnano]).process(css_o, postcss_opt)
  fs.outputFileSync(tar_dir + '/main.css', r.css)
}
```

[PostCSS](https://postcss.org/) 를 통해서, nested css 구문을 정리하고, [UnoCSS](https://unocss.dev/) 모듈로 Utility-First css 구문을 파싱하고, 압축하여 `main.css` 를 생성하도록 했다.

그리고, 나머지 static 파일들을 복사하는 구문도 포함했다.

## 빌드 선택 스크립트

마지막에 아래와 같은 스크립트를 추가한다.

```js
switch (process.argv[2]) {
  case 'md':
    build_md()
    break
  case 'asset':
    build_asset()
    break
  case 'layout':
    build_layout()
    break
  case 'full':
    fs.outputJSONSync('./_pages/pageinfo.json', [])
    fs.removeSync('./docs')
    build_md()
    build_layout()
    build_asset()
    break
  default:
    console.log('you gave wrong command')
}
```

간단히 보자면, `node build.js [command]` 와 같은 형태로 선택하며 빌드할 수 있도록 꾸며봤다.

다음으로 진행할 것은 [Github Actions](https://docs.github.com/ko/actions) 를 사용하여 빌드를 자동화 할 것인데, 자동화에는 `bulid_md` 함수만 작동하도록 할 생각이다. 웹페이지 레이아웃이나, css, static 리소스가 바뀔 일은 거의 없기 때문이기에, 따라서 빌드 정도를 선택할 수 있도록 switch 구문으로 구분하였다.

참고로 `node build.js full` 을 터미널에 입력하면 전체 빌드가 다시 되는데, 마크다운 메타데이터가 담겨있는 `pageinfo.json` 파일을 초기화하고, 빌드 결과가 담긴 `/docs` 폴더를 삭제하여 모든 내용들이 처음부터 다시 빌드되도록 했다. 