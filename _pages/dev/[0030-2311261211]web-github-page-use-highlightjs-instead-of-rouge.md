---
layout: page
title: "깃허브 페이지 하이라이터, Highlight.js 사용하고, 약간의 커스터마이징"
description: Jekyll 의 기본 하이라이터인 Rouge 대신 Highlight.js 사용 및 커스터마이징
updated: 2023-11-25
tags: dev
---

## 2023-11-25 Update

아래에서 `pseudo.js` 부분을 새롭게 업데이트 했다.

## 하이라이터 변경
 
깃허브 페이지의 기본 정적 웹페이지 제너레이터인 [Jekyll](https://pages.github.com/) 의 기본 코드 하이라이터는 [Rouge](http://rouge.jneen.net/) 다.

별 불편없이 사용하고 있었으나, Excel 관련 자료를 포스팅하려고 보니 Rouge 는 Excel 문법을 지원하지 않는다는 것을 알았다.

그래서 Excel 하이라이팅을 지원하는 [Highlight.js](https://highlightjs.org/) 로 바꿔보기로 하였다.

## Rouge 사용 중지 설정

먼저 Rouge 사용을 하지 않도록 설정을 한다. 구글링해보면 방법을 쉽게 찾을 수 있는데, 아래 코드를 `_config.yml` 파일에 삽입했다.

```yaml
# _config.yml

markdown: kramdown
kramdown:
  syntax_highlighter_opts:
    disable: true
```

## Highlight.js 설치

다음은 Highlight.js 를 설치한다. `_layouts` 폴더에 있는 `default.html` 파일에 아래 코드를 삽입했다. 가장 기본적인 설치법이기도 하다.

```html
<!-- default.html -->

<!-- head 태그 제일 아래쪽에 삽입 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.3/styles/github.min.css"/>

<!-- body 태그 제일 아래쪽에 삽입 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.3/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.3/languages/excel.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.3/languages/vbnet.min.js"></script>
<script>
  hljs.initHighlightingOnLoad();
</script>
```

highlight.js 홈페이지를 살펴보면 설치법이 나와있다. 최신 버전은 11 이고, 이미 10 버전부터 IE11 지원이 되지 않는다. 아직은 우리나라의 IE 사용 비중이 높은 편이라 보기에, 버전 9 로 설치하였다.

Excel, 그리고 VBA 코드 하이라이팅을 위한 Visual Basic 은 디폴트 지원언어가 아니라서 별도의 랭귀지팩 (?) 을 추가로 삽입하였다.

이렇게 하고, 홈페이지를 새로고침해보면 기존의 포스팅을 수정할 필요도 없이 그대로 잘 작동하는 것을 확인할 수 있다. Excel 과 VBA 하이라이팅도 잘 작동한다.

## 하이라이팅 코드에 줄번호 삽입

[플러그인](https://wcoder.github.io/highlightjs-line-numbers.js/) 을 사용하면 쉽게 적용할 수 있다. 개인적인 취향에는 안맞는 것 같아 적용해보았다가 바로 빼버렸다.

## Custom 스타일 적용

[Highlight.js 라이센스](https://github.com/highlightjs/highlight.js/blob/main/LICENSE)를 살펴보면, 사용자가 코드를 수정하여 사용하는 것을 허용하고 있다.

나만의 스타일을 적용해보고 싶어 CSS 파일을 새롭게 구성해 봤다. [Highlight.js 도움말](https://highlightjs.readthedocs.io/en/latest/theme-guide.html)을 살펴보면 스타일 수정 가이드를 볼 수 있지만, 기초적인 css 문법만 알고 있으면 굳이 도움말 없이도 수정이 가능하다.

수정한 내용을 `highlightjs-style.css` 파일로 저장했다.

## 새로운 하이라이팅 규칙 만들기

알고리즘 학습 포스팅에 pseudo 코드를 작성할 때가 있었는데, plaintext 로 하다보니 밋밋해서 스타일을 넣어보기로 했다.

[Highlight.js 도움말](https://highlightjs.readthedocs.io/en/latest/language-guide.html)이나 제작자가 제공한 랭귀지팩 [소스 코드](https://github.com/highlightjs/highlight.js/tree/9-18-stable/src/languages)를 참고하여, 삽질을 해가면서 아래와 같이 만들어보았다.

```javascript
// pseudo.js

hljs.registerLanguage("pseudo", function(hljs) {
  return {
    aliases: ['ps'],
    contains: [
      {
        className: 'comment',
        begin: /#/,
        end: /\s\s|\n|$/,
      },
      {
        className: 'strong',
        begin: /\b[A-Z][A-Z0-9]*\b/,
      },
      {
        className: 'number',
        begin: /\b[0-9]+\b/,
      },
      {
        className: 'leadline',
        begin: /[─│┌┐┘└├┬┤┴┼←↑→↓]+/,
      },
    ],
  };
});
```

아주 간단한 것만 적용했다. 순서대로 살펴보면 우선 "pseudo" 라고 명명했다. 나중에 포스팅할 때 마크다운에서는 {% raw %}<code>```pseudo</code>{% endraw %} 로 시작하면 적용된다.

크게 strong, number, leadline, comment 를 판단하여 스타일링 하도록 했다. begin, end 속성에 정규식을 사용했는데 그 의미는 쉽게 이해할 거라 생각한다.

leadline 은 원래 Highlight.js 에서 디폴트로 적용되는 클래스명이 아니지만 이렇게 별도로 지정할 수 있다. css 파일에 `.hljs-leadline{ ... }` 와 같은 식으로 추가하면 된다.

위 코드를 pseudo.js 파일로 저장했다.

## 최종 설치 코드

```html
<!-- default.html -->

<!-- head 태그 제일 아래쪽에 삽입 -->
<link rel="stylesheet" href="/css/highlightjs-style.css"/>

<!-- body 태그 제일 아래쪽에 삽입 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.3/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.3/languages/excel.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.3/languages/vbnet.min.js"></script>
<script src="/js/pseudo.js"></script>
<script>
  hljs.initHighlightingOnLoad();
</script>
```
{:.html}

## 사용 예시

아래는 커스터마이징 한 pseudo 코드가 어떻게 하이라이팅이 되는지 실제로 적용해 본 예시다.

```pseudo
# 연결리스트 예시
head
│  └ # 가장 첫 NODE 를 참조하는 변수
│    
↓
NODE      ┌───→ NODE      ┌───→ NODE
├ val=1   │     ├ val=2   │     ├ val=3
└ next ───┘     └ next ───┘     └ next ───→ None

# Fibonacci 수열
초기값: f(0) = 0, f(1) = 1
일반항: f(i) = f(i - 2) + f(i - 1)
```
