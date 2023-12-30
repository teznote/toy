---
title: "Python Lambda 함수식 안에서 Statement 사용하기"
description: 한줄로 표현할 수 있는 Lambda 함수식에 Statement 를 적용하여 활용 폭을 넓혀보는 방법
updated: 2021-09-07
---

## Expression 만 허용하는 Lambda 함수식
 
함수를 생성하는 def 구문 대신, 간편하게 함수를 생성해주는 lambda 구문을 사용할 때가 있다. 다른 언어의 익명함수와 비슷한데 Python 에서는 Expression 만 허용한다. 즉 lambda 함수식 안에는 변수에 값을 대입, break, return, while, global 등등 사용이 불가하다.

참고로 무엇이 Statement 이고, 무엇이 Expression 인지 긴가민가하다면 [Python 공식문서](https://docs.python.org/ko/3/reference/index.html)에서, 6, 7, 8 항목을 살펴보기 바란다.

## Def 함수식을 Lambda 함수식으로 전환

하지만 아쉬울 때가 있는데, 방법이 없는 것은 아니다. def 로 정의된 어떤 함수를 lambda 함수로 바꿔본다고 해보자. 아래와 같은 두가지를 하면 된다.

> - Statement 와 동일한 기능을 할 수 있는 Expression 찾기
> - 위에서 찾아낸 Expression 들을 튜플에 순서대로 담고, 제일 마지막 요소를 리턴

구체적으로 나타내면 아래와 같다.

```python
# Def 함수식
def f(arg):
    statement1
    statement2
    statement3
    ...
    return res

# Lambda 함수식
f = lambda arg: (expression1, expression2, expression3, ... , res)[-1]
```

statement 1, 2, 3 과 동일한 기능을 하는 expression 1, 2, 3 을 튜플에 순서대로 담고, 마지막 튜플 요소를 리턴 대상으로 삼는 것이다. 튜플의 각 요소는 제일 왼쪽 요소부터 순서대로 평가가 되고, `[-1]` 인덱스 참조로 제일 마지막 요소를 반환하는 식이다.

Statement 와 동일한 기능을 하는 Expression 을 찾는 것이 가장 중요한데, [이 사이트](http://p-nand-q.com/python/lambda.html)를 보면, 다소 과거 Python 버전을 대상으로 하기는 했지만 나름 재밌는 내용을 확인할 수 있다.

그리고 중요한 건, 코드 작성자 입장에서 편리하기는 하지만, 가독성을 해치지 않는 범위에서만 적절히 사용해야 한다는 것을 잊지는 말아야 한다.

## Expression 으로 전환 예시

### 1. 대입 (Assignment)

Python 의 대입문 (변수에 값을 대입 또는 할당) 은 Statement 다. 이에 대한 불편함 때문인지 Expression 으로 평가하는 대입문이 3.8 버전 이상에서 소개되었다. := 연산자를 사용한 대입이 그것인데, [Python 공식문서](https://docs.python.org/ko/3/whatsnew/3.8.html#assignment-expressions)를 참고해보자.

3.8 이전 버전이라면, := 연산자를 사용할 수 없으므로, 함수 호출을 이용한 대입을 해야 한다. (참고로, 함수의 호출은 Expression 으로 평가된다.)

예를들어, 어떤 리스트 a 가 있을 때, `a[1] = 10` 과 같은 Statement 는 `a.__setitem__(1, 10)` 과 같이 사용하면 된다. 리스트, 딕셔너리와 같이 요소에 값을 대입해주는 함수를 내장한 개체만이 가능하다. 따라서 단순 정수형과 같은 변수로의 대입은 대체 함수를 찾을 수 없어 Expression 전환이 어렵다.

### 2. For 반복문 break

For 반복문은 List Comprehension 표현식이나, map 함수를 사용하는 것으로 대신할 수 있다. 문제는 순회 중간에 break 할 수 있냐는 것인데, 불가능하지는 않다. [별도 포스팅](/code-snippet/python-break-out-of-list-comprehension-on-a-certain-condition)에 List Comprehension 의 break 에 대해 소개했으니 참고해보기 바란다.

### 3. TBD

앞으로 포스팅을 할만한 내용이 생기면 추가할 생각이다.
