# WebPointer Project Architecture Rules

## 1. CSS 스타일링 아키텍처 (Single Centralized CSS)
- **정책**: 단일 중앙 집중형 CSS 파일(`Webpointer.css`)에서 모든 스타일을 통합 관리한다.
- **원칙**:
  - `index.html` 내부에 `<style>` 블록을 중복 선언하지 않는다.
  - JS 파일 내부에서 동적 모달 생성 시 불필요한 인라인 스타일 남발을 지양하고 `Webpointer.css` 클래스를 활용한다.

## 2. 이원화 버전 관리 및 캐시 버스팅 (Dual Versioning & Cache-Busting)
- **정책**: 정식 시맨틱 버전(`SEMVER`, 사용자 승인제)과 일자 기반 캐시 버스팅 태그(`BUILD_TAG`: `YYYYMMDDvN`, 코드 수정 시 자동 갱신) 이원화 체계를 적용한다.
- **관리 파일**:
  - `module/version.js`: `window.WebpointerVersion = { SEMVER: '1.0.0', BUILD_TAG: '20261108v1' }` 정의
  - `index.html`: 모든 로컬 CSS(`<link>`) 및 JS(`<script>`) 로드 경로 뒤에 `?v=YYYYMMDDvN` 쿼리스트링을 부여하여 브라우저 강제 새로고침 없이 최신 번들이 즉시 반영되도록 유지한다.

## 3. 모듈 분리 아키텍처 (Modularized Tool Handlers)
- `module/tools/ribbonHandlers.js`에 집중되어 있던 기능들을 단일 책임 원칙(SRP)에 따라 아래 하위 모듈로 분리하여 관리한다:
  - `module/tools/historyManager.js`: Undo/Redo 히스토리 스택, 스냅샷 캡처 및 복원
  - `module/tools/fileSlotManager.js`: 로컬 스토리지 슬롯 저장/불러오기, SVG 파일 열기/저장/내보내기, 드래그 앤 드롭 파일 로더
  - `module/tools/fillStyleManager.js`: 단색/선형·방사형 그라데이션/패턴/이미지 채우기 팝오버 및 `<defs>` 생성 관리
  - `module/tools/effectClipManager.js`: SVG 필터 이펙트(드롭 섀도우, 블러, 글로우 등) 및 쿠키커터 심볼 클리핑 관리
  - `module/tools/alignSnapManager.js`: 다중 객체 정렬(Align), 간격 분배(Distribute), 스마트 스냅 가이드(Smart Snaps) 연산
  - `module/tools/assetPresetManager.js`: 마커 매니저, 그라데이션 프리셋 매니저, 패스(뫼비우스 등) 매니저, 내장/커스텀 심볼 및 이미지 모달
  - `module/tools/animHandlers.js`: SMIL 애니메이션 추가/제거/재생/정지 (중복 제거 후 단일 모듈 유지)
  - `module/tools/ribbonHandlers.js`: 리본 탭 도구 선택, 기본 선/면/텍스트 속성 핸들러, 설정 모달, 레이어/그룹화/변형 및 공통 유틸리티
