# AGENTS.md

이 저장소에서 작업하는 AI 코딩 에이전트(Claude Code, Cursor, Copilot 등)를 위한 안내입니다.

## 프로젝트 개요

빌드 도구 없는 순수 HTML/CSS/JavaScript 정적 웹 앱입니다. jQuery와 html2canvas는 CDN(`index.html`의 `<script>` 태그)으로 로드하며, 별도의 패키지 매니저나 번들러가 없습니다.

## 로컬 실행

```bash
cd memo-app
python3 -m http.server 8080
# http://localhost:8080 접속
```

`index.html`을 더블클릭해서 직접 열어도 대부분 동작하지만, 로컬 서버로 여는 걸 권장합니다.

## 파일 구조

```
memo-app/
├── index.html       # 전체 화면(목록·편집·모달) 마크업
├── css/style.css    # 스타일 (라이트/다크 테마는 CSS 변수로 전환)
├── js/
│   ├── app.js       # 전체 UI 로직 (jQuery, IIFE 하나로 구성)
│   └── db.js        # IndexedDB 데이터 레이어 (notes, fonts 스토어)
└── img/help/         # 앱 내 "사용법" 모달에 쓰이는 스크린샷
```

## 작업 규칙

- **빌드 단계를 추가하지 마세요.** 트랜스파일러, 번들러, 프레임워크 도입은 이 프로젝트의 방향과 맞지 않습니다.
- **데이터는 브라우저 IndexedDB에만 저장됩니다.** 서버·백엔드가 없고, 앞으로도 추가하지 않는 것이 기본 전제입니다.
- **`js/app.js`는 jQuery 스타일(콜백/Promise 체인)로 통일되어 있습니다.** 새 코드도 기존 스타일(들여쓰기, 함수 선언 패턴)을 따라주세요.
- **UI를 변경했다면 실제 브라우저에서 확인하세요.** 가능하면 Playwright 등으로 헤드리스 브라우저를 띄워 콘솔 에러 없이 동작하는지 확인한 뒤 완료로 보고하세요.
- **커밋 전 사용자 승인 없이 `git push`, GitHub 설정 변경(예: Pages 활성화) 등 외부에 영향을 주는 작업을 하지 마세요.**
