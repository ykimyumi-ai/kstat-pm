# 미리보기용 웹폰트

- `KoPubDotum-{Medium,Bold}.woff` — 편집기 미리보기가 실제 산출물과 같은 글자꼴로
  보이도록 함께 배포한다. `node_modules/font-kopub` 의 원본을 그대로 복사한 것이다.
- `KoPub-LICENSE.md` — KoPub서체 라이선스 약관. 제4조 ④에 따라 서체를 배포·전송할
  때 약관을 함께 안내해야 하므로 폰트 옆에 둔다. 저작권은 문화체육관광부·한국출판인회의에
  있고, 무료 사용·재배포는 허용되나 서체 자체의 유료 판매는 금지된다.
- `metrics.json` — `node tools/gen-metrics.js` 가 TTF 에서 기계로 뽑은 폭 표.
  브라우저가 TTF(3.1MB) 없이도 CLI 와 똑같이 넘침을 계산하게 한다. **직접 고치지 말 것.**
  TTF 경로와 같은 값을 내는지는 `node tools/check-metrics.js` 로 대조한다.
