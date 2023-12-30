---
layout: page
title: Tez'Note 블로그 빌더 개발노트 03 - markdown-it, highlight.js 커스터마이징
description: 코드 하이라이터에 의사코드 하이라이팅, 라인별 하이라이팅 기능 추가 커스터마이징
updated: 2023-12-02
tags: dev
---

## 커스터마이징

3rd-party 모듈을 사용하면 편하다. 그리고 안전하다. 하지만 이런것도 있었으면, 이랬으면, 하는 생각이 드는 건 어쩔 수 없나보다.

마크다운 파싱에 [markdown-it](https://github.com/markdown-it/markdown-it#readme) 과 [highlight.js](https://highlightjs.org/) 를 사용하는데, 의사코드 (Pseudo Code) 를 하이라이팅하고 (highlight.js 가 지원하지 않는 언어 하이라이팅 규칙 생성), 라인별로도 하이라이팅할 수 있는 (일부 라인 강조 규칙 생성) 기능을 추가해보기로 했다.

## 의사코드 하이라이팅 규칙 생성

앞서서 생성한 `build.js` 를 열어서 아래 내용을 이어서 추가했다.

```js
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
        begin: /[─│┌┐┘└├┬┤┴┼▲▶▼◀↑→↓←]+/,
      },
    ],
  }
})
```

`pseudo` 라는 임의의 언어를 생성하는 구문이다. [highlight.js 도움말](https://highlightjs.readthedocs.io/en/latest/language-guide.html)과 다른 언어 팩이 어떻게 만들어졌는지를 참고하여 삽질끝에 적당히 만들 수 있었다.

새로운 class 도 커스터마이징을 할 수 있다. 위 코드에서 `comment`, `strong`, `number` 는 미리 정의가 되어있는 class 로 규칙만 만들면 되지만, 제일 아래에 있는 `leadline` class 는 임의로 생성한 명칭으로, 별도로 css 파일에 `.hljs-leadline` 속성도 정의해야 한다.

마크다운에 아래처럼 적용하면 `pseudo` 언어로 하이라이팅 된다.

````markdown
```pseudo
blah... blah...
blah...
``` 
````

아래는 실제로 사용한 예시다.

```pseudo
# linked list 구조

head ─────→ NODE       ┌───→ NODE
            ├ val: 1   │     ├ val: 2
            └ next ────┘     └ next ─────→ null
```

## 라인별 하이라이팅 기능 생성

`build.js` 파일에 아래 내용을 이어서 작성했다.

```js
const md = new markdownIt({
  html: true,
  xhtmlOut: true,
  highlight: function (str, lang) {
    let lines_o = str.trim().match(/^[\s\S]*?$/gm)

    let str_modified = ''
    let tar_line = new Map()
    for (let [i, x] of lines_o.entries()) {
      let prefix = x[0]
      if (prefix === '+' || prefix === '-' || prefix === ':') {
        tar_line.set(i, prefix)
        x = x.slice(1)
      }
      str_modified += (x ? x : ' ') + '\n'
    }

    const _lang = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    const lines = hljs.highlight(str_modified, { language: _lang }).value.trim().match(/^[\s\S]*?$/gm)

    let res = ''
    for (let [i, x] of lines.entries()) {
      x = `<div class="line ${tar_line.get(i) || ''}">${x}</div>`
      res += x
    }
    
    return res
  },
})
```

[markdown-it](https://github.com/markdown-it/markdown-it#init-with-presets-and-options) 홈페이지를 보면, 실제 마크다운 파싱을 하는 `md` 변수를 생성할 때의 각종 초기 옵션 설정 도움말을 볼 수 있다.

`higlight` 부분이 핵심인데, 마크다운 파싱하다가 <code>``` python</code> 과 같은 펜스구문을 만나면, 펜스 안의 내용 (콘텐츠) 과 사용언어 (여기서는 python) 각각을 `highlight` 로 명명한 함수인 `function (str, lang)` 에 대입하여 처리토록 되어있다.

코드를 대략 요약하면...

정규식으로 `str` 각 라인을 배열로 잘라내고, 배열을 순회하면서 만일 각 라인의 제일 앞이 `+`, `-`, `:` 라면 이를 잘라내고 몇번째 라인이었는지 기억해둔다.

그리고 `hljs` 오브젝트로 하이라이팅 구문을 생성하고, 이를 다시 각 라인을 배열로 잘라낸다. 라인을 순회하면서, 각 라인을 `<div>` 태그로 감싸고, `line` 이라는 class 이름과 앞서서 몇번째인지 기억해뒀던 `+`, `-`, `:` 에 해당하는 라인 차례가 되면 이것도 class 이름으로 삽입토록 했다.

나중에 css 파일에 `.line.\: {background-color: #eee;}` 등으로 속성을 지정하면 된다. 아래는 이를 사용해 본 예시다.

```python
# leetcode 1 번 문제 python brute force 풀이

>def twoSum(self, nums: List[int], target: int) -> List[int]:
-  for i, x in enumerate(nums):
+  for i, x in enumerate(nums[:-1]):
-    for j, y in enumerate(nums):
+    for j, y in enumerate(nums[i+1:], i+1):
      if x+y == target:
        return i, j
```