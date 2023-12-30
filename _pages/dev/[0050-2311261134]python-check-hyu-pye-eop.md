---
title: "Python 으로 국세청 휴폐업 조회 API 사용"
description: Python 코드로 국세청에서 제공하는 사업자등록번호 기반 휴폐업 조회 시스템 API 사용 
updated: 2023-08-15
---

## 국세청 휴폐업 조회

사업자번호로 실제 사업자가 계속사업중인지, 휴업이나 폐업을 했는지 알아낼 수 있다. [국세청_사업자등록정보 진위확인 및 상태조회 서비스](https://www.data.go.kr/data/15081808/openapi.do)에서 제공하는 API 서비스를 사용하면 최대 100 개씩 조회가 가능하다.

## 공공데이터 포털 인증키 발급

API 서비스를 사용하려면 공공데이터 포털에 가입하고 API 사용 신청을 해야 한다. [공공데이터](https://www.data.go.kr/ugs/selectPublicDataUseGuideView.do) 포털에서 API 사용 신청 방법을 확인할 수 있다.

## Python 코딩

회사 업무 상 필요할 때가 있어서, 다량의 사업자번호를 주면 100 개씩 끊어서 계속 조회하고, 결과값을 CSV 파일로 저장해주는 코드를 구글링 통해 짜깁기 해봤다.


```python
# python

no = [
    "1111111111", "1111111112"    # 상태 조회를 원하는 사업자번호를 리스트 형태로 삽입
]

import requests
import pandas as pd
from time import sleep
import os

auth = 'XXXX'    # XXXX 에 공공데이터 포털에서 API 사용 신청 후 발급받은 인증키 삽입
headers = {
  'accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': auth,
}
params = (('serviceKey', auth),)

for i in range(len(no)//100+1):
  sleep(1)
  print('진행단계: {}'.format(i))
  data = '{{ "b_no": [{}] }}'.format(','.join('"{}"'.format(str(x)) for x in no[i*100:(i+1)*100]))
  res = requests.post('https://api.odcloud.kr/api/nts-businessman/v1/status', headers=headers, params=params, data=data)

  dict = pd.read_json(res.text)
  df = pd.json_normalize(dict['data']) 
  index, mode, encoding, header = [False, 'a', 'utf-8-sig', False] if os.path.exists('output.csv') else [False, 'w', 'utf-8-sig', True]
  df.to_csv('output.csv', index=index, mode=mode, encoding=encoding, header=header)
```

Python 은 물론 [requests](https://requests.readthedocs.io/en/latest/) 와 [pandas](https://pandas.pydata.org/) 모듈도 사전에 설치되어 있어야 한다.

`no` 리스트에 사업자번호를 문자열 형식으로 담은 다음 실행하면, 1 회 반복마다 100 개씩 API 로 조회 요청을 보내게 되며, 그 결과는 pandas 통해 `output.csv` 파일에 100 개씩 누적해서 저장이 된다.

중간에 모종의 이유로 실행이 멈춘다면 `output.csv` 내용을 확인하고, 이후부터 다시 돌리면 된다.