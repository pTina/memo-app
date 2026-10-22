# 메모장

폰트를 직접 업로드해 적용하고, 선택한 글자에만 색상·형광펜·자간·행간을 지정할 수 있는 커스텀 웹 메모장입니다. Google 계정으로 로그인한 뒤 메모는 Firestore에 저장되고, 폰트 파일은 이 브라우저의 IndexedDB에만 둡니다.

**라이브 사이트:** https://ptina.github.io/memo-app/

## 기술 스택

- React, TypeScript, Vite
- Tailwind CSS v4, KRDS 토큰
- TanStack Query, Zustand, React Router
- Tiptap, Firebase Auth / Firestore
- 폰트 파일: IndexedDB

## 시작하기

```bash
cd memo-app
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다. 실제 Google 로그인을 쓰려면 `.env.local`에 Firebase 웹 설정(키 이름만 `.env.example` 참고)을 넣습니다. 기기 간 폰트 동기화는 `VITE_FONT_WORKER_URL`과 Cloudflare 워커가 필요합니다.

GitHub Pages는 `gh-pages` 브랜치의 빌드 결과물을 사용합니다. `npm run deploy:pages`로 배포합니다. Firebase 인증 승인된 도메인에 `ptina.github.io`를 추가해야 라이브에서 Google 로그인이 됩니다.

## 데이터 저장

- 로그인 + Firebase 설정: 메모·설정은 Firestore `users/{uid}/...`
- 폰트 파일: 항상 IndexedDB (`memo-fonts`)
- Firebase 설정이 없으면 메모·설정도 localStorage에 둡니다
- 브라우저 저장소를 지우면 로컬 폰트(및 로컬 모드 메모)가 함께 삭제됩니다
