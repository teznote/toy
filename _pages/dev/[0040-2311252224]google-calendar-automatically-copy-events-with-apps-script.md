---
layout: page
title: "Apps Script 로 구글 캘린더를 다른 캘린더로 자동 복사"
description: 구글 Apps Script 활용하여 구글 캘린더 일정을 자동으로 복사
updated: 2023-06-13
tags: dev
---

## 구글 캘린더를 다른 캘린더로 복사

구글 캘린더로 공유 받은 캘린더에 있는 모든 일정을 다른 캘린더로 복사해야 할 일이 있었다.

일정이 생길 때마다 확인해서 수동으로 복사해주면 되긴 했지만, 일정 변경이나 삭제가 잦을 때는 귀찮기도 해서 자동화 할 수 있는 방법이 없을까 찾아보았다.

찾아보니, 구글에서 제공하는 다양한 웹 어플리케이션을 자동화 할 수 있는 [Apps Script](https://www.google.com/script/start/) 가 있어 이를 사용해보기로 했다. MS 오피스에서 VBA 를 다루는 것과 비슷한 느낌이다.

결론부터 얘기하자면 뭔가 오류가 많은 것 같아 잘 사용하지는 않을 것 같다. (몰론 본인이 제대로 만들어내지도 못하는 것일 수도 있다.) 스크립트를 수동을 실행하면 잘 작동하는데, 트리거에 등록하여 매시간마다 작동하도록 했더니 경우에 따라 작동하지 않는 케이스도 있었다.

## 프로젝트 설정

위에 언급한 Apps Script 링크를 타고, 로그인 후, 새 프로젝트를 선택하면 자동으로 편집기가 열린다. 그곳에 코드를 작성하면 되고, 왼쪽 메뉴를 보면 시계모양의 트리거도 등록하여 정기적으로 실행되도록 할 수 있다.

## 구현 로직

원본 캘린더 (이하 SRC) 에 있는 일정들을 사본 캘린더 (이하 TAR) 에 복사해 넣는 것이 핵심이다.

SRC 에 있는 모든 일정들을 일일이 TAR 에 복사하는 것은 비효율이므로, 캘린더의 상태를 나타내는 `nextSyncToken` 속성을 읽어, 달라진 일정(삭제되거나 변경되거나 추가된 일정들)만 추려서 업데이트 하도록 했다.

또한 TAR 의 일정을 직접 수정한 경우에는 D+30 에 해당하는 TAR 일정을 불러와 SRC 와 다르다면 맞춰주거나 삭제하도록 했다.

아래부터는 구현한 코드다. (더 효율적인 방법을 찾아낼 때마다 업데이트 할 생각이다.)

## SRC 일정들을 TAR 에 복사

```js
// 원본 캘린더에서 변화한 일정만을 찾고, 사본 캘린더에 id가 없다면 삽입, id가 있다면 업데이트
var src_id = '[원본 캘린더의 ID]';  // 캘린더 ID 는 구글 캘린더에서 캘린더 선택하면 나오는 하위 메뉴의 "설정 및 공유" 에서 확인 가능
var tar_id = '[사본 캘린더의 ID]';
var token = PropertiesService.getScriptProperties().getProperty(`${src_id}_syncToken`);

var srcs;
if (token) {
  srcs = Calendar.Events.list(src_id, {'syncToken': token});
} else {
  var d = new Date();
  d.setDate(d.getDate() - 30);
  srcs = Calendar.Events.list(src_id, {'timeMin': d.toISOString()});
}
PropertiesService.getScriptProperties().setProperty(`${src_id}_syncToken`, srcs.nextSyncToken);

for (var x of srcs.items) {
  try {
    Calendar.Events.insert(x, tar_id);
  } catch(e) {
    delete x.sequence;
    Calendar.Events.update(x, tar_id, x.id);
  }
}
```

## TAR 의 일정을 SRC 일정에 맞춤

```js
// 사본 캘린더에서 D+30일까지의 일정 중, 원본 캘린더에 id가 없다면 삭제, id가 있다면 데이터 일치여부 판단해서 원본에 일치시킴
var f = new Date();
f.setDate(f.getDate() + 30);
var tars = Calendar.Events.list(tar_id, {'timeMin': new Date().toISOString(), 'timeMax': f.toISOString()});

for (var x of tars.items) {
  try {
    var w = Calendar.Events.get(src_id, x.id);
    delete x.sequence;
    delete w.sequence;
    if (w !== x) {
      Calendar.Events.update(w, tar_id, w.id);
    }
  } catch(e) {
    Calendar.Events.remove(tar_id, x.id);
  }
}
```