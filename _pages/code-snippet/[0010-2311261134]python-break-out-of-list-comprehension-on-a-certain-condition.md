---
layout: page
title: "Python 에서 List Comprehension 순회 중간에 break 하기"
description: List comprehension 문법으로 순회 도중, 특정한 조건일 때 순회 break 를 거는 방법 소개
updated: 2021-09-07
tags: code-snippet
---

## Comprehension 표현식과 break
 
Comprehension 표현식은, 어떤 iterable 개체를 처음부터 끝까지 순회하면서 이런저런 처리를 손쉽게 할 수 있도록 해주는 Python 의 강력한 기능이다.

어떤 특정한 상황에서는 순회 중간에 끊어버리고 싶을 때가 있는데, for 나 while 반복문에서 사용하는 break 를 사용하면 에러가 발생한다. break 는 Comprehension 표현식이 요구하는 Expression 이 아닌 Statement 이기 때문이다.

```python
arr = [1, 2, 3, 4, 5, 4, 3, 2, 1]

print([x for x in arr if x < 4])             # [1, 2, 3, 3, 2, 1]
print([x for x in arr if x < 4 or break])    # 에러 발생
```

`x < 4` 가 더 이상 True 가 아닐 때 바로 순회를 종료해버리고 싶다면, itertools 모듈의 takeWhile 함수를 사용하면 된다.

```python
from itertools import takewhile

arr = [1, 2, 3, 4, 5, 4, 3, 2, 1]

print(list(takewhile(lambda x: x < 4, arr)))    # [1, 2, 3]
```

## Comprehension 순회 중간에 순회 대상의 모든 요소를 없애기

하지만 어떻게든 List Comprehension 형태를 유지하면서 순회 중간에 종료를 하고 싶다하면, 아예 방법이 없는 것은 아니다. 먼저 순회 중간에 순회 대상을 없애버리는 방법을 생각할 수 있다.

```python
arr = [1, 2, 3, 4, 5, 4, 3, 2, 1]

print([x for x in arr if x < 4 or arr.clear()])    # [1, 2, 3]

print(arr)    # [] <-- 순회하던 리스트가 빈 리스트가 됨
```

`x < 4` 가 더 이상 True 가 아닐 때, `arr.clear()` 구문이 실행된다. 함수호출은 Expression 이기 때문에 사용할 수가 있고, clear 함수는 리스트 모든 요소를 없애버린다. 없어졌기 때문에 더 이상 순회를 못하는 점을 이용한 것이다.

참고로 이 방식은 튜플, 딕셔너리, set 자료형에는 적용할 수 없다. 에러가 발생하기 때문이다.

## 순회 대상을 제너레이터로 감싸기

순회 대상은 그대로 두고, 이를 제너레이터로 감싼 뒤, 특정 상황에서 제너레이터 동작을 멈추도록 하는 방식을 생각할 수 있다.

```python
arr = [1, 2, 3, 4, 5, 4, 3, 2, 1]
g = (x for x in arr)    # 괄호로 Comprehension 표현식을 감싸면 Generator 를 리턴한다.

print([x for x in g if x < 4 or g.close()])    # [1, 2, 3]

print(arr)    # [1, 2, 3, 4, 5, 4, 3, 2, 1]
```

arr 리스트를 제너레이터로 감싼 뒤, g 에 대입하였다. (물론 직접 def 구문으로 제너레이터를 생성해도 된다.)

`x < 4` 가 더 이상 True 가 아닐 때, `g.close()` 구문이 실행된다. close 함수는 GeneratorExit 예외를 발생시키며 제너레이터 동작을 중단시킨다. 순회 대상 자체를 변형하는 것이 아니기 때문에, Comprehension 순회 도중 끊어도 원래의 arr 리스트는 유지가 된다.

그리고 제너레이터로 감싸기만 하면 되기 때문에, 튜플, 딕셔너리, set 자료형에도 얼마든지 적용할 수 있다.
