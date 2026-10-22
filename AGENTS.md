# AGENTS.md

이 저장소에서 작업하는 AI 코딩 에이전트(Claude Code, Cursor, Copilot 등)를 위한 안내입니다.

## 프로젝트 개요

Vite + React + TypeScript 메모 앱입니다. 스타일은 Tailwind CSS v4와 KRDS 토큰을 쓰고, 화면 상태는 Zustand, 저장소 상태는 TanStack Query를 사용합니다.

Google 로그인 후 메모·설정은 Firestore(`users/{uid}/...`)에 둡니다. 폰트 파일은 IndexedDB에만 둡니다(Cloud Storage 미사용). API 키가 없으면 로컬 어댑터(localStorage + IndexedDB)로 동작합니다. 저장소 교체는 `src/shared/storage/index.ts`에서만 합니다.

로컬 → 계정 이전(요구사항 15)은 아직 구현하지 않습니다.

## 로컬 실행

```bash
cd memo-app
npm install
npm run dev
# http://localhost:5173 접속
```

실제 Google 로그인은 `.env.local`에 Firebase 웹 설정이 필요합니다. 키 값은 이 파일에만 두고 읽거나 커밋하지 않습니다.

프로덕션 빌드는 `npm run build`이며, 결과물은 `dist/`입니다. 배포 경로 base는 `/memo-app/`입니다. 프로덕션 빌드에는 `VITE_AUTH_BYPASS` / `VITE_USE_EMULATOR` / `VITE_USE_AUTH_EMULATOR`를 켜지 않습니다.

## 파일 구조

```
memo-app/
├── index.html
├── src/
│   ├── index.css          # 전역 토큰, 다크 테마, 종이 결
│   ├── app/               # 라우터, providers, 진입점
│   ├── pages/             # 로그인, 목록, 편집, 휴지통
│   ├── features/          # 인증, 메모, 휴지통, 폰트, 테마, 설정, 보안
│   ├── shared/            # 타입, Firebase, 저장소 어댑터, 아이콘
│   └── store/             # UI 상태
├── firebase/              # Firestore 규칙·인덱스, Emulator 시드
├── docs/                  # 요구사항
└── img/help/              # 사용법 스크린샷
```

## 작업 규칙

- 저장소 접근은 `src/shared/storage` 어댑터를 통하고, 메서드는 `async`로 유지합니다.
- 메모 본문과 제목을 `console`에 남기지 않습니다.
- 비밀값은 `.env.*.local`에만 두고, `.env.example`에는 키 이름만 적습니다.
- UI를 바꿨다면 브라우저에서 동작과 콘솔 에러를 확인합니다.
- 사용자 승인 없이 `git push`나 GitHub 설정 변경을 하지 않습니다.
