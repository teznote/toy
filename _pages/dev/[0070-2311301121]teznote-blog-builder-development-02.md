---
layout: page
title: Tez'Note 블로그 빌더 개발노트 02 - 폴더, 파일들 초기 셋업
description: 본격 코딩 전 각종 모듈 import 및 주요 config 파일들 셋업
updated: 2023-11-30
tags: dev
---

## Github 레포지토리 클론

기존 [Jekyll](https://jekyllrb-ko.github.io/) SSG 로 운용하던 블로그 레포지토리에서 작업하기로 했다.

먼저 Ubuntu 22.04 (Windows 11 WSL), [Node.JS](https://nodejs.org/en) 18 버전 환경에서, 작업하기 적당한 폴더로 이동한 뒤, 터미널에 아래와 같이 입력한다.

```bash
git clone https://github.com/teznote/teznote.github.io
cd teznote.github.io
rm -rf *
```

원격 레포지토리에 있는 내용을 로컬로 받아와서 그 안에 있는 내용을 몽땅 지워버린다. (물론 .git 폴더는 지우지 말아야 한다.)

깨끗이 비운 뒤 다시 Push 했다.

## 프로젝트 폴더 생성

프로텍트 루트 폴더 밑에 아래와 같은 명령어로 폴더들을 생성한다.

```bash
mkdir _assets
mkdir _layouts
mkdir _pages
```
## 각종 모듈 설치

프로젝트 루트 폴더에서 npm 으로 초기화 및 모듈을 설치한다.

```bash
npm init -y
npm i -D fast-glob fs-extra markdown-it highlight.js html-minifier gray-matter liquidjs postcss postcss-nested unocss cssnano
```

`package.json` 파일을 열어보면, 설치된 모듈들도 보이고 뭔가가 적당히 설정되어 있다.

추가로 아래 내용을 Json 형식에 맞게 적당한 위치에 삽입했다. 현재의 표준인 [ES 모듈](https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Modules)을 디폴트로 사용하기 위해서다.

```json
// ./package.json

"type": "module"
```

## build.js 초기화

이제 `build.js` 파일을 프로젝트 루트 폴더에 생성한다. 빌더 프로젝트의 가장 핵심이 되는 파일로, 빌드를 위한 모든 코드들을 이 파일안에 몽땅 때려박을 예정이다.

우선 이 파일 안에 아래 내용을 코딩한다. 설치한 모듈을 import 하기 위한 구문이다.

```js
// ./build.js

import fg from 'fast-glob'
import fs from 'fs-extra'
import matter from 'gray-matter'
import yaml from 'js-yaml'

import postcss from 'postcss'
import postcss_nested from 'postcss-nested'
import unocss from '@unocss/postcss'
import cssnano from 'cssnano'

import { Liquid } from 'liquidjs'
import { minify } from 'html-minifier'

import hljs from 'highlight.js'
import markdownIt from 'markdown-it'
```

대략적으로 모듈을 살펴보면...

[fast-glob](https://github.com/mrmlnc/fast-glob#readme) 은 glob 패턴을 사용하여, 로컬에 저장된 파일들을 경로를 배열 형식으로 리턴하는 모듈이다. 마크다운 포스팅들을 읽어들이는 용도로 쓸 예정이다.

[fs-extra](https://github.com/jprichardson/node-fs-extra) 는 [Node.JS](https://nodejs.org/en) 의 빌트인 모듈인 fs 를 보다 편리하게 개선한 모듈이라 보면 된다.

[gray-matter](https://github.com/jonschlinkert/gray-matter) 는 마크다운이나, 템플릿 html 의 상단에 포함되어있는 프론트매터와 그 아래의 콘텐츠를 각각 읽어서 각각을 오브젝트 형식으로 리턴하는 모듈이다.

[js-yaml](github.com/nodeca/js-yaml#readme) 은 비록 npm 으로 설치하지는 않았으나 gray-matter 설치를 하면 같이 사용할 수 있는 모듈로 Yaml 형식의 데이터를 파싱하여 오브젝트 형식으로 리턴하는 모듈이다.

[postcss](https://postcss.org/) 는 CSS 후처리기(?) 로 이해되는데, 여기에 각종 플러그인들을 연결하여 편리하게 CSS 를 빌드할 수 있다.

[postcss_nested](https://github.com/postcss/postcss-nested#readme) 는 [SASS](https://sass-lang.com/) 의 Nested 문법과 같은 구조를 웹브라우저가 읽을 수 있는 형태로 파싱해준다.

[UnoCSS](https://unocss.dev/) 는 Utility-First CSS 를 사용하기 위한 도구로, 웹페이지에 아이콘도 편리하게 삽입하는 기능도 제공한다.

[cssnano](https://github.com/cssnano/cssnano) 는 CSS 구문을 압축해주는 툴이다.

[liquidjs](https://liquidjs.com/) 는 [Jekyll](http://jekyllrb-ko.github.io/) SSG 에서 사용되는 템플릿 엔진으로 익숙하기 때문에 사용하였다. 마크다운 파싱 후, 파싱된 html 코드 앞뒤로 html 덧붙이기 위해 사용하였다.

[html-minifier](https://github.com/kangax/html-minifier) 는 이름에서 알 수 있듯 빌드된 html 을 마지막으로 압축하기 위해 사용하는 모듈이다.

[highlight.js](https://highlightjs.org/) 는 코드 Syntax 하이라이트를 해주는 도구로, Jekyll 로 블로그를 운영할 때부터 사용했다. Jekyll 의 기본 하이라이트인 [Rouge](https://github.com/rouge-ruby/rouge) 보다도 지원하는 언어가 더 많아서였다. (Highlight.js 는 엑셀과 VBA 도 하이라이팅을 지원한다.)

[markdown-it](https://github.com/markdown-it/markdown-it#readme) 은 마크다운 형식의 파일이나 텍스트를 html 변환해주는 도구다.

## UnoCSS 초기화

`_assets` 폴더 안에 `main.css` 파일을 생성하고, 아래 내용만 우선 채운다.

```css
/* ./_assets/main.css */

@unocss all;
```

프로젝트 루트 폴더에 `uno.config.ts` 파일을 생성하고, 구글링 통해서 각종 초기화 방법을 찾아서 세팅했다.

```typescript
// ./uno.config.ts

import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'
import fs from 'fs-extra'

export default defineConfig({
  preflights: [
    {
      getCSS: ({ theme }) => fs.readFileSync('./node_modules/@unocss/reset/eric-meyer.css', 'utf-8'),
    },
  ],
  content: {
    filesystem: [
      './_layouts/**/*.html',
    ]
  },
  theme: {
    fontFamily: {
      sans: 'NanumSquareRound, sans-serif',
      mono: 'Hack, NanumSquareRound, monospace',
    },
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
      cdn: 'https://esm.sh/'
    }),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})

```

대략적인 내용을 살펴보자면, `eric-meyer.css` 내용을 그대로 가져오고, `_layouts` 폴더에 있는 html 파일의 Utility-First CSS 를 파싱하고, `font-sans` 와 `font-mono` 는 주어진대로 변환하고, 아이콘을 삽입할 때 적용할 스타일과 어디서 소스를 가져올지를 지정해뒀다. 