# Webpointer 벡터 CAD 시뮬레이터 - 마스터 한글 기술 구현 명세서 (Master Technical Specification)

> [!IMPORTANT]
> 본 문서는 Webpointer 웹 애플리케이션의 모든 기능, 구조, 알고리즘, 리본 메뉴 탭, 단축키, SMIL 애니메이션 수트, 필터 효과, 서식 엔진, 파일 불러오기/저장 파서, E2E 검증 체계를 통합 명세한 최신 마스터 문서입니다. 본 문서만 읽고 웹앱의 전 기능을 100% 파악할 수 있도록 작성되었습니다.

---

## 1. 시스템 개요 및 아키텍처 (System Architecture)

### 1.1 캔버스 시스템 & 종횡비 연산
* **기본 캔버스 비율**: 16:9 ($960 \times 540\,\text{px}$)
* **스냅 격자 시스템 (481×271 Step Grid)**:
  * 가로 축: $0 \le Step_X \le 480$ (총 481개 정밀 스냅 스텝 포인트)
  * 세로 축: $0 \le Step_Y \le 270$ (총 271개 정밀 스냅 스텝 포인트)
  * 좌표 정밀 변환 공식:
    $$Pixel_X = \frac{Step_X}{480} \times 960, \quad Pixel_Y = \frac{Step_Y}{270} \times 540$$
* **캔버스 종횡비 자동 확장 & 세로 리사이즈 핸들 바**:
  * 외부 세로형(Portrait) SVG (예: `성경요약.svg`, `720x1280`) 불러오기 시 `viewBox` 1:1 일치 및 캔버스 높이 자동 연장.
  * 최하단 `═══ 캔버스 세로 높이 조절 ═══` 마우스 드래그 핸들 바(`#canvasResizeHandle`) 탑재로 캔버스 높이 자유 조정 가능.

### 1.2 모듈 아키텍처 구조 (`module/`)
* `module/main.js`: 전역 이벤트 캡처, 단축키, 마우스 줌, Pan 도구 드래그 및 초기화 엔트리포인트.
* `module/core/objects.js`: SVG 개체 데이터 모델 생성, 바운딩 박스 연산, 회전/대칭 렌더링.
* `module/core/selection.js`: 단일/다중 선택, 마퀴(Marquee) 박스 드래그, 근접 거리 선택 계산.
* `module/core/bezier.js`: 2차/3차 베지어 곡선 좌표 계산, 대칭 핸들 제어점 연동.
* `module/tools/textTool.js`: Direct In-Canvas 텍스트 입력 및 깜빡이는 커서 바(`.blinking-caret`).
* `module/tools/ribbonHandlers.js`: 서식 변환, 색상/필터 스택, SMIL 애니메이션 생성기, 파일 저장/불러오기.
* `module/tools/svgImporter.js`: 외부 SVG 네이티브 파서, `fill-opacity`/`stroke-opacity` 보정, 개체 클리어 및 viewBox 자동 맞춤.
* `module/render/icons.js`: 50종+ SVG 툴 아이콘 실시간 딕셔너리 (`WebpointerIcons`).
* `module/render/renderRibbon.js`: MS 오피스 5대 리본 탭 DOM 및 툴팁 관리자.
* `module/render/renderCanvas.js`: SVG DOM 캔버스 개체, 선택 박스, 조종점 및 스냅 가이드선 실시간 렌더링.

---

## 2. 상단 메뉴 탭 & 리본 컨트롤 명세 (Ribbon Menu Tabs)

### 2.1 `파일` (File) 탭
* **`파일 불러오기` (`openFile`)**: 로컬 `.json`, `.webpointer`, `.svg` 파일 읽기. 기존 캔버스 개체 클리어 및 방어 모달 연동.
* **`파일 저장하기(웹에 저장)` (`saveFileToWeb`)**: 3개 슬롯 순환 자동 저장 (`webpointer_slot_1, 2, 3`) 및 썸네일 모달 제공.
* **`파일 다운로드` (`downloadFile`)**: `.webpointer` 프로젝트 JSON 파일 및 벡터 `.svg` 파일 내보내기.
* **`뒤로가기` (`undo`: `Ctrl + Z`) & `앞으로가기` (`redo`: `Ctrl + Y` / `Ctrl + Shift + Z`)**: 캔버스 상태 히스토리 스택 복원.

### 2.2 `삽입` (Insert) 탭
* **도형 삽입 (`shapeTools`)**:
  1. **`Pan (손/팬 이동 도구)` (1행 1열)**: 마우스 드래그로 캔버스 화면 상하좌우 실시간 팬(Pan) 조작 (`Alt + H`).
  2. **`Select (선택)`**: 마우스 클릭 및 마퀴 박스로 개체 선택.
  3. **`Point (점)`**: 단일 정밀 점 생성.
  4. **`Line (직선)`**: 2점 연결 직선 생성.
  5. **`Rectangle (직사각형)`**: 사각형 생성.
  6. **`Ellipse (타원/원)`**: 4조종점 타원 생성.
  7. **`Arc (호)`**: 6조종점 시작/끝 각도 호 생성.
  8. **`Bez2 (2차 베지어 곡선)`**: 1조종점 2차 곡선 생성.
  9. **`Bez3 (3차 베지어 곡선)`**: 2조종점 3차 대칭 곡선 생성.
  10. **`Text (텍스트 상자 추가)`**: Canvas 클릭 및 즉시 타이핑 텍스트 입력.
* **개체 순서 (`layerTools`)**:
  * **`맨 앞으로 가져오기` (`bringToFront`: `Shift + ]`)**: 하얀 종이 2장 위 노란 종이 맨 전면 배치.
  * **`앞으로 가져오기` (`bringForward`: `]`)**: 하얀 종이 1장 위 노란 종이 전면 배치.
  * **`뒤로 보내기` (`sendBackward`: `[`)**: 하얀 종이 1장 아래 노란 종이 뒤편 배치.
  * **`맨 뒤로 보내기` (`sendToBack`: `Shift + [`)**: 하얀 종이 2장 아래 노란 종이 최하단 배치.
* **개체 그룹 (`groupTools`)**:
  * **`그룹` (`group`: `Ctrl + G`)**: 선택 개체 중첩 그룹화.
  * **`그룹 해제` (`ungroup`: `Ctrl + Shift + G`)**: 최외곽 그룹 1단계 계층 해제.
* **개체 위치 & 회전/대칭 (`alignTools` & `transformTools`)**:
  * 6방향 기하 정렬 (좌, 우, 상, 하, 가로중앙, 세로중앙) 및 2방향 동일 간격 정렬.
  * 4방향 대칭/회전: 좌우 대칭(`flipH`), 상하 대칭(`flipV`), 시계 90도(`rotate90`), 반시계 90도(`rotateNeg90`).
  * **`선택 창` (`openSymbolModal`)**: 심볼 라이브러리 관리자 모달.

### 2.3 `그림 서식` (Picture Format / Style) 탭
* **`색상` (Color Category)**:
  * 27슬롯 UniPalette 스와치 팔레트, 1x2 라디오 타겟 선택자 (선/채우기).
  * 3종 이미지 채우기 모드: **늘리기 (Stretch)**, **반복 (Tile)**, **1회만 채우기 (Single)**.
  * **멀티스탑 그라데이션 에디터**: 선형/방사형 그라데이션 램프 편집 및 캔버스 상 2-Point 핸들 조정.
* **`선` (Line Category)**: 선 두께 입력, `점선` 토글 및 커스텀 파라미터 팝업.
* **`선 끝` (Line Ends Category)**: 시작/끝 마커 (화살표, 원, 다이아몬드) 및 꽉찬/빈모양 토글 (`cycleStartMarker`, `cycleEndMarker`).
* **`마감` (Cap & Join Category)**:
  * **끝처리 토글 (`cycleStrokeCap`)**: `butt` (평평함), `round` (둥글게), `square` (돌출 사각형).
  * **꺾임 토글 (`cycleStrokeJoin`)**: `miter` (뾰족함), `round` (둥글게), `bevel` (깎임).
* **`필터 스택` (Picture Filter Effects)**:
  * 중첩 그림 필터 팝업 (밝기, 대비, 흐림, 채도, 흑백, 세피아, 색상회전, 반전, 그림자, 클리핑 비파괴 크롭).
  * 필터 스택 순서 재배치 (▲/▼) 및 라이브 슬라이더 실시간 미리보기.

### 2.4 `글 서식` (Text Format) 탭
* **`글꼴` (Font Category)**: `font-family`, `font-size` (+/- 단축키), `Bold`, `Italic`, `Strikethrough`, `Line-Height`.
* **`글자 정렬`**: 단일 4방향 수평 정렬 순환 버튼 (좌 $\rightarrow$ 중앙 $\rightarrow$ 우 $\rightarrow$ 양쪽) 및 단일 3방향 수직 정렬 순환 버튼 (상 $\rightarrow$ 중 $\rightarrow$ 하).
* **`도형 텍스트 맞춤`**: 3방향 Auto-Fit 토글 (도형 확대 / 글자 축소 / 안 맞춤).
* **`커스텀 SVG 밑줄 렌더러`**: 6종 밑줄 스타일 (Solid, Dashed, Dotted, Double, Wavy, None) 및 두께/간격/색상 연산.

### 2.5 `애니메이션` (SVG SMIL Animation Suite) 탭
* **SMIL 8단계 애니메이션 파라미터 수트**:
  1. **대상 선택**: 선택 개체 `targetId` 실시간 표시.
  2. **변환 타입**: `fill`, `stroke`, `stroke-width`, `opacity`, `transform:translate`, `transform:scale`, `transform:rotate`, `d`.
  3. **목표 값**: 시작값(`from`), 목표값(`to`), 다중 중간값(`values="v1;v2;v3"`).
  4. **트리거 (`begin`)**: `0s`(자동), `click`(클릭 시), `mouseover`(호버 시), `mouseleave`(아웃 시), `anim1.end`(연쇄 실행).
  5. **시간 설정 (`dur`)**: 1회 실행 소요 시간 (예: `2s`).
  6. **반복 조건 (`repeatCount`)**: `indefinite`(무한), `1`, `2`, `3`, `5`회.
  7. **제한 및 재시작**: `max`(절대 시간 상한선, 예: `5s`), `restart`(`always`, `whenNotActive`, `never`).
  8. **종료 조건 (`end`)**: 이벤트/시간 기반 강제 중단 조건 (예: `mouseleave`, `10s`).
* **다중 트랙 중첩 관리**:
  * **[➕ 애니메이션 추가]**: 개체에 복수의 병렬/직렬 SMIL 애니메이션 태그 동적 추가.
  * **[🗑️ 트랙 전체 제거]**: 개체에 할당된 전체 애니메이션 태그 초기화.
  * **11종 빠른 프리셋 적용 & 정지**: 선 그리기, 페이드, 회전, 맥박, 바운스, 색상, 변형, 대시, 줌, 흔들기, 발광.

### 2.6 `설정` (Settings) 탭 (Right-Aligned)
* **격자 조절**: 격자 표시 여부 체크박스 및 격자 간격 입력 (px).
* **스냅 & 근접 선택 거리**: 스냅 활성화 토글 및 근접 자동 선택 거리(`proximityThreshold`, 기본 `30px`).
* **기본 도형 크기**: 클릭 시 생성되는 기본 크기 (`100px`).

---

## 3. 단축키 명세 (Keyboard Shortcuts)

| **단축키** | **기능 설명** |
| :--- | :--- |
| **`Ctrl + Z`** | 실행 취소 (Undo) |
| **`Ctrl + Y` / `Ctrl + Shift + Z`** | 다시 실행 (Redo) |
| **`Ctrl + A`** | 캔버스 전체 개체 선택 |
| **`Ctrl + G`** | 선택 객체 그룹화 (Group) |
| **`Ctrl + Shift + G`** | 선택 그룹 계층 해제 (Ungroup) |
| **`Alt + H`** | 손/팬 이동 도구 (Pan Tool) 활성화 |
| **`Shift + ]`** | 맨 앞으로 가져오기 (Bring to Front) |
| **`]`** | 앞으로 가져오기 (Bring Forward) |
| **`[`** | 뒤로 보내기 (Send Backward) |
| **`Shift + [`** | 맨 뒤로 보내기 (Send to Back) |
| **`+` / `-`** | 텍스트 선택 시 폰트 크기 확대/축소 |
| **`F2` / Double-Click** | Canvas 텍스트 인라인 즉시 편집 |
| **`Esc`** | 텍스트 편집 완료 / 선택 취소 |
| **Mouse Wheel Scroll** | 캔버스 화면 줌 인/아웃 |

---

## 4. E2E 자동화 테스트 스위트 (`test-results/TC.csv`)

Playwright 테스트 실행 시 `node run_tests.js` 명령을 통해 전체 29개 E2E 테스트 스위트가 실행되며 결과를 `test-results/TC.csv` 파일에 실시간 커밋합니다:

- `TC01`: 앱 초기화 및 콘솔 에러 없음 검증
- `TC02`: 사각형 드로잉 및 텍스트 요소 추가 검증
- `TC03`: 단일 순환 버튼 및 글 서식 밑줄 검증
- `TC04`: Undo/Redo 히스토리 스택 검증
- `TC05`: 설정 탭 및 격자 배경 지속성 검증
- `TC06`: 비주얼 스냅샷 베이스라인 검증
- `TC07`: 전 도형 드로잉 수트 (점, 선, 타원, 호, 베지어) 검증
- `TC08`: 그림 서식 수트 검증
- `TC09`: 세부 텍스트 서식 수트 검증
- `TC10`: 근접 선택 거리 및 최단거리 개체 감지 검증
- `TC11`: 웹 로컬저장소 저장 및 파일 모달 검증
- `TC12`: 애니메이션 프리셋 검증
- `TC13`: 단축키 안내 팝업 검증
- `TC14`: 세부 설정 모달 및 근접 역치 적용 검증
- `TC15`: 폰트 크기 단축키 (+/-) 검증
- `TC16`: 비파괴 크롭 ClipPath 검증
- `TC17`: 외부 SVG 가져오기 및 파서 진단 검증
- `TC18`: 심볼 관리자 및 레지스트리 조작 검증
- `TC19`: 확장 채우기 팔레트 수트 검증
- `TC20`: 중첩 그림 필터 효과 수트 검증
- `TC21`: 심볼 쿠키커터 클리핑 검증
- `TC22`: 스마트 정렬 스냅 가이드선 검증
- `TC23`: 개체 정렬 및 균등 분배 도구 검증
- `TC24`: 3슬롯 자동 저장 및 파일 불러오기 방어 검증
- `TC25`: 이미지 채우기 3모드 (늘리기/반복/1회) 검증
- `TC26`: 멀티스탑 그라데이션 및 2-Point 핸들 검증
- `TC27`: 도형 내 텍스트 수평/수직 정렬 연산 검증
- `TC28`: 라이브 필터 미리보기 및 스택 재배치 검증
- `TC29`: 회전/대칭, SMIL 애니메이션, 단축키 및 줌 검증
