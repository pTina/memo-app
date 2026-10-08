# 메모장

폰트를 직접 업로드해 적용하고, 선택한 글자에만 색상·형광펜·자간·행간을 지정하며, 원하는 영역을 이미지로 내보낼 수 있는 커스텀 웹 메모장입니다. 데이터는 이 브라우저 안에만 저장됩니다.

**라이브 사이트:** https://ptina.github.io/memo-app/

지금 저장소는 화면 기능을 다시 붙이기 전의 기반입니다. 로컬 저장 어댑터, 목록·편집·휴지통 라우트, 라이트·다크·시스템 테마 전환까지 연결되어 있습니다. 메모 목록 카드, 에디터, 휴지통 화면, 폰트·백업 모달은 다음 단계에서 구현합니다.

## 기술 스택

- React, TypeScript, Vite
- Tailwind CSS v4, KRDS 토큰
- TanStack Query, Zustand, React Router
- 메모·설정: localStorage / 폰트 파일: IndexedDB

## 시작하기

```bash
cd memo-app
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다.

## 프로젝트 구조

```
memo-app/
├── index.html
├── src/
│   ├── index.css
│   ├── app/
│   ├── pages/
│   ├── features/
│   ├── shared/
│   └── store/
├── docs/
└── img/help/
```

## 데이터 저장

메모와 설정은 `localStorage`(`memo:memos`, `memo:settings`)에, 업로드한 폰트 파일은 IndexedDB(`memo-fonts`)에 저장됩니다. 브라우저 저장소를 지우면 데이터도 함께 삭제됩니다.
