---
layout: page
title: Tez'Note 블로그 빌더 개발노트 04 - 웹페이지 레이아웃 설정과 SPA, dark 테마 스크립트
description: 웹페이지로 구현될 레이아웃 템플릿 작성 및 SPA, dark 테마 사용 위한 스크립트 구문 설정 
updated: 2023-12-02
tags: dev
---

## 레이아웃 템플릿

`_layouts` 폴더에 `base.html`, `nav.html`, `page.html` 3 개의 파일을 생성한다.

`base.html` 은 전체 웹페이지를 구성하는 레이아웃이고, `nav.html` 는 네비게이션 페이지를, `page.html` 은 마크다운으로 구현된 포스팅 각각을 감싸는 페이지를 만들어내기 위한 레이아웃이다.

가장 중요한 파일인 `base.html` 은 빌드 후에는 index.html 가 되며, 이 웹페이지 안에서 SPA 방식에 따라 모든 포스팅과 네비게이션이 나타나게 된다. 그리고 다크 테마로 전환되는 스위치도 삽입했다.

## SPA (Single Page Application) 설정

해시 (#) 가 아닌 History 방식으로 작동하는 SPA 를 만들어보기로 했다. 이를 위한 스크립트를 아래와 같이 작성하여 `base.html` 안에 삽입했다.

```js
fill_content()

async function fill_content() {
  const cur_pathname = window.location.pathname
  let res = ''
  try {
    res = await (await fetch(cur_pathname + (cur_pathname === '/' ? 'index.json' : '.json'))).json()
  } catch (err) {
    res = await (await fetch('/404.json')).json()
  }
  document.querySelector('main').innerHTML = res.content
}
document.body.onclick = async e => {
  if (e.target.matches('a') && e.target.href.startsWith(window.location.origin) && !e.target.getAttribute('href').match(/[.#]/)) {
    e.preventDefault()
    if (e.target.href !== window.location.href) {
      history.pushState(null, null, e.target.href)
      await fill_content()
      document.querySelector('body >div').scrollTo({ top: 0 })
    }
  }
}
window.onpopstate = e => {
  fill_content()
}
```

대략 아래와 같은 기능이 구현되어야 한다.

> - `<a>` 태그를 클릭했을 때, 링크 주소로 웹페이지를 연결하는 것이 아니라, 링크 주소와 관련된 json 파일 로드하여 화면에 띄움
> - 주소를 직접 입력했을 때, 링크 주소와 관련된 json 파일 로드하여 화면에 띄움
> - 웹페이지 앞, 뒤가기 버튼을 클릭했을 때, 주소가 바뀌면서 해당 주소와 관련된 json 파일을 로드하여 화면에 띄움

공통적으로 나오는 것이, json 파일 로드 후 화면에 띄우는 작업이다. 이를 `fill_content` 함수로 구현하였다. 현재 표시된 인터넷 주소를 `window.location.pathname` 으로 읽어서, 주소와 동일한 로컬 파일 경로에 있는 json 파일을 로드한다. 만약 파일이 없다면 대신 `404.json` 을 로드한다. 그리고 이를 `<main>` 태그 하위에 붙이는 식으로 작동한다.

`<a>` 태그를 클릭했을 때 제어는 `document.body.onclick` 함수에 연결된 함수에서 담당한다.처음에는 `<a>` 태그 클릭 이벤트 처리로 하려했는데 잘 되지 않았다. 구글링해보니 `<a>` 태그 상위에 있는 태그의 이벤트로 처리해야 한다고 한다. 이유는 잘 모르겠다. 

어느 경우일 때 본래의 `<a>` 동작이 아닌 SPA 작동이 되도록 할지를 우선 판단해야 한다. 이벤트 타겟 `e.target` 이 `<a>` 태그이면서, 링크 주소가 블로그주소로 시작하고, 주소에 `.` 이나 `#` 이 없는 경우 (파일 다운로드, 해시 링크가 아닐 것) 가 그것이다.

이 경우에만 `e.preventDefault()` 구문으로 본래의 동작을 막아버리고, 클릭한 주소가 현재의 주소가 같지 않은 경우 (즉, 새로운 json 로딩이 필요한 경우) 에만 `history.pushState` 함수를 통해 화면에 보이는 주소를 바꾸고, `fill_content` 함수를 호출한다.

주소를 직접 입력했을 때는 사실 스크립트로 제어가 안된다. 이는 클라이언트가 아닌 서버가 처리하는 영역이기 때문이다. Github Page 는 정적사이트만 배포할 수 있기 때문에 입력된 주소와 일치하는 경로에 있는 웹페이지를 띄우려하지만, Tez'Note 블로그는 `index.html` 밖에 없으므로 404 에러를 뱉을 수밖에 없다.

그런데, Github Page 는 404 에러의 경우 `404.html` 파일이 있다면 이를 대신 띄우게 된다. 이 점에 착안하여 `index.html` 과 정확하게 동일한 `404.html` 을 둔다면, `404.html` 이 로딩될 것이고, 위 스크립트 제일 상단에 있는 `fill_content` 함수가 호출되어 입력한 주소에 맞는 json 파일이 로딩된다.

뒤이은 포스팅에서 `build.js` 내용을 추가작성하는데, `index.html` 을 생성하고 이를 그대로 `404.html` 로 복사하는 구문이 들어갈 것이다.

웹페이지 앞, 뒤가기 버튼 클릭의 경우 `popstate` 이벤트가 발생하고, 그동안 축적된 세션 (`history.pushState` 함수로 호출한 주소도 포함된다.) 에 따라 주소가 변경된다. `window.onpopstate` 에 `popstate` 이벤트 발생 시 처리할 구문을 연결하면 되는데 `fill_content` 함수만 호출해주면 된다.

## 다크테마 전환 스크립트

`base.html` 안에 별도의 스크립트로 아래 내용을 삽입했다.

```js
$root = document.querySelector('html')
$switch_theme_input = document.querySelector('#switch-theme input')

let cur_theme = window.sessionStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches  ? 'dark' : 'light')
if (cur_theme === 'dark') {
  $switch_theme_input.checked = true
  set_theme('dark')
}
function set_theme(theme) {
  if (theme === 'dark') {
    $root.classList.add('dark')
    window.sessionStorage.setItem('theme', 'dark')
  } else {
    $root.classList.remove('dark')
    window.sessionStorage.setItem('theme', 'light')
  }
}
$switch_theme_input.addEventListener('click', e => {
  set_theme((e.target.checked) ? 'dark' : 'light')
})
```

id 가 `switch-theme` 인 태그 아래에 있는 `<input>` 을 클릭할 때마다 테마가 전환되도록 하는 것이 기본이다. 전환이 되면 스타일이 모두 바껴야한다. css 파일에 다크 테마 용도의 스타일을 미리 설정해두고, 테마가 전환되면 해당 스타일을 사용토록 하는 방식으로 하기로 했다.

위 스크립트를 보면 `$switch_theme_input` 변수에 `<input>` 태그를 연결하고, 클릭 이벤트 발생할 때마다 테마를 전환하는 `set_theme` 함수를 호출하도록 했다. `set_theme` 함수를 보면 다크 테마로 변경될 경우, `<html>` 최상위 태그를 가리키는 `$root` 함수를 통해 `dark` class 를 붙이도록 했다. 즉, `dark` 라고 명명될 경우 다크 테마 css 를 적용토록 하면 된다.

`_assets` 폴더 안의 `main.css` 파일을 열어서 아래 내용과 유사하게 작성한다.

```css
:root {
  --foreground-color: rgb(0, 0, 0); --background-color: rgb(255, 255, 255);
  &.dark {
    --foreground-color: rgb(255, 255, 255); --background-color: rgb(0, 0, 0);
  }
}
```

css 변수를 사용했다. 동일한 변수들이 `dark` 클래스가 있고 없고에 따라 값이 다르다. 뒤 이은 태그들의 컬러 속성 등을 변수로 연결해두면 (예를들어 `body { color: var(--foreground-color); background: var(--background-color); }`) 간단하게 테마 설정도 되고 나중에 수정도 간편할 것이다.

그리고 nested css 형식인데 정식 css 형식은 아니다. 나중에 [PostCSS](https://postcss.org/) 후처리기로 웹브라우저가 읽을 수 있는 css 형식으로 바뀌어 빌드된다.

중요한점은 `window.sessionStorage` 를 사용하는 점이다. 이를 사용하는 이유는 사용자의 테마 선택을 미리 저장하기 위함이며, 웹페이지가 처음 로드될 때 `cur_theme` 변수에 테마 선택을 우선 로드하고, 없다면 시스템의 테마를 로드하도록 했다.