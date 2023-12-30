---
title: Tez'Note 블로그 빌더 개발노트 01 - 콘셉트와 프로젝트 구조
description: Tez'Note 블로그 콘셉트와 빌더 프로젝트 구조
updated: 2023-11-29
---

## 빌더 콘셉트

그동안 블로그에 많이 사용되는 유명한 SSG 툴인 [Jekyll](https://jekyllrb-ko.github.io/) 을 사용해왔는데, 개인적인 스터디도 할 겸해서 직접 블로그 빌더를 구축해보기로 하였다.

어떤 방식으로 빌드가 되도록 할까 하다가 아래와 같이 정했다.

> - Historical SPA 방식으로 작동 (메뉴 또는 포스팅을 클릭거나 주소를 입력하면 Json 형식의 콘텐츠를 불러오도록 함)
> - 포스팅은 마크다운으로 작성하되, Github 에 올리면 자동으로 빌드(마크다운 -> Html -> Json 으로 저장) 되도록 함
> - 마크다운 파일을 `[ver]pathname.md` 형태로 저장하고, `ver` 가 변경된 파일만 빌드, `ver` 에 따라 포스팅 정렬, `pathname` 은 포스팅 주소가 되도록 함

약 한달간을 삽질한 끝에 적당히(?) 빌더를 만들 수 있었다. `build.js` 파일에 필요한 기능을 몽땅 때려박고, `/docs` 폴더에 빌드 결과물 (Html, Json 파일 등) 을 저장되도록 했다.

이후 포스팅을 새로 작성해서 Github 레포지토리에 푸시하면, Github Actions 가 빌드 및 `/docs` 폴더 Deploy 를 자동으로 실행하도록 구성하였다.

## 사용 모듈

주요한 모듈만 밝히자면, 마크다운 파싱을 위해 [markdown-it](https://github.com/markdown-it/markdown-it), 코드 하이라이트를 위해 [highlight.js](https://highlightjs.org/), html 구축을 위해 템플릿 언어로 [LiquidJS](https://liquidjs.com/index.html) 를 사용했다.

Jekyll 경험 때문인지, LiquidJS 를 사용했으며, 프론트매터 파싱을 위해 [gray-matter](https://github.com/jonschlinkert/gray-matter) 도 이용했다. Jekyll 과 유사하게 프론트매터의 `layout` 속성에 따라 템플릿이 순차 적용되도록 했다.

이외에도 요새 핫한 Utility-First CSS 도 써보고 싶어서, [UnoCSS](https://unocss.dev/) 를 사용했으며, UnoCSS 를 Node.JS 와 접목시키기 위해 [PostCSS](https://postcss.org/) 모듈의 도움을 받았다.

## 개발 프로젝트 폴더 구조

```pseudo
Project Root
  │
  ├ _assets
  │   └ main.css
  │
  ├ _layouts
  │   └ base.html
  │     nav.html
  │     page.html
  │
  ├ _pages
  │
  └ build.js
    uno.config.ts
```

`_assets` 폴더에는 UnoCSS 에 의해 빌드되는 `main.css` 파일과, 그 외 특별한 수정없이 Deploy 되어야 할 static 파일들 (예를들면 `favicon.svg`) 이 위치해야 하고,

`_layouts` 폴더에는 LiquidJS 의 템플릿이 들어가되, `base.html` 은 SPA 의 껍데기를 구성하는 가장 기본적인 html 파일이며, `nav.html` 은 네비게이션을 위한 전체 포스팅 구조를, `page.html` 은 파싱된 마크다운과 결합하여 각 포스팅을 구성하게 되는 템플릿이다. `nav.html` 과 `pages.html` 빌드 결과는 위에서 언급한대로 Json 파일이다.

`_pages` 폴더에는 실제로 블로그를 운영할 때 마크다운 형식의 포스팅들이 저장될 장소다. 폴더에 맞게 올리면 해당 폴더구조가 그대로 주소 (즉, pathname) 가 되도록 했다.

프로젝트 루트 폴더의 `build.js` 는 빌드를 위한 코드를, `uno.config.ts` 는 UnoCSS 의 설정파일이 저장될 파일이다.

## 블로그 웹페이지 구조

위에서 언급했듯, SPA 로 구성했다. 즉, 최종 빌드 결과물은 `index.html` 파일 하나만 존재한다. (나중에 다시 언급하겠지만 실제로는 Github Page 특성 때문에 `index.html` 과 내용이 동일한 `404.html` 도 빌드 되어야 한다.)

구조는 아래와 같이 단순하게 만들었다.

```html
<!-- ... -->
<header>
  헤더, 메뉴 (블로그 등록된 포스팅 나열)
</header>
<main>
  <!-- 메뉴 또는 포스팅 선택에 따라 Json 로딩하여 출력 -->
  포스팅, 네비게이션 
</main>
<footer>
  푸터
</footer>
<script>
  // Light-Dark 테마 스크립트
  // Historical SPA 작동 스크립트 
</script>
```

`메뉴`를 클릭하면, `<main></main>` 사이에 네이게이션 (`nav.html` 빌드 결과) 이, 네이게이션 안의 `포스팅`을 클릭하면 포스팅 (`page.html` 빌드 결과) 가 로딩되도록 했다.

그리고 테마 전환과 Historical SPA 작동이 이뤄지기 위한 스크립트를 추가했다.
