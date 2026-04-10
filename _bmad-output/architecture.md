---
stepsCompleted: [1, 2]
inputDocuments: ['src/**', 'README.md']
workflowType: 'architecture'
project_name: 'suika-game'
user_name: 'yumi'
date: '2026-04-10'
---

# Architecture Decision Document — 수박게임 (Suika Game)

_기존 코드베이스 역방향 분석을 통해 문서화된 아키텍처입니다._

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 수박게임 (Suika Game) |
| 배포 URL | https://suika-game-pearl.vercel.app/ |
| 목적 | 물리 엔진 기반 웹 브라우저 수박게임 |
| 대상 플랫폼 | PC + 모바일 (반응형) |

---

## 2. 기술 스택

| 분류 | 기술 | 버전 | 선택 이유 |
|------|------|------|-----------|
| 프레임워크 | Next.js (App Router) | 16 | SSR/SSG + Vercel 배포 최적화 |
| 언어 | TypeScript | 5 (strict) | 타입 안전성, 게임 상태 명확한 모델링 |
| 물리 엔진 | Matter.js | 0.20 | 브라우저 2D 물리 시뮬레이션 |
| 스타일링 | Tailwind CSS | 4 | 레이아웃 유틸리티, 게임 UI 래퍼 |
| 패키지 관리 | pnpm | - | 디스크 효율, 빠른 설치 |
| 렌더링 | Canvas 2D API | - | 커스텀 과일 그래픽, 60fps 렌더링 |
| 호스팅 | Vercel | - | Next.js 네이티브 배포 |

---

## 3. 레이어 아키텍처

```
┌─────────────────────────────────────────────┐
│              Next.js App Layer               │
│  src/app/ (layout, page, globals.css)        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Component Layer                    │
│  GameLoader (SSR bypass) → GameCanvas        │
└──────────────────┬──────────────────────────┘
                   │ React Hooks Bridge
┌──────────────────▼──────────────────────────┐
│              Hooks Layer                     │
│  useGameEngine │ useGameLoop                 │
│  useResponsive │ useLocalStorage             │
└────┬──────────────────────────┬─────────────┘
     │                          │
┌────▼────────┐      ┌──────────▼──────────────┐
│ Game Logic  │      │     Browser APIs         │
│  engine.ts  │      │  requestAnimationFrame   │
│ renderer.ts │      │  ResizeObserver          │
│ collision.ts│      │  localStorage            │
│  controls.ts│      │  Canvas 2D               │
│ gameState.ts│      └─────────────────────────┘
│   fruits.ts │
│ constants.ts│
└─────────────┘
```

---

## 4. 핵심 아키텍처 결정 (ADR)

### ADR-001: SSR 우회 — `GameLoader` 동적 임포트

**결정:** `GameCanvas`를 Next.js `dynamic(() => import(...), { ssr: false })`로 로드

**이유:**
- Matter.js는 브라우저 전용 API(`window`, `document`)에 의존
- Next.js App Router는 기본적으로 서버에서 렌더링 시도
- SSR 시도 시 Matter.js가 즉시 에러 발생

**결과:** `GameLoader`가 얇은 클라이언트 진입점 역할을 하고, 실제 게임은 완전히 클라이언트에서만 실행

---

### ADR-002: Ref 기반 게임 상태 관리

**결정:** 게임 상태(`gameStateRef`, `dropXRef`, `effectsRef`)를 `useRef`로 관리, React `useState` 최소화

**이유:**
- 게임 루프는 60fps로 실행 → `useState`로 상태 변경 시 매 프레임 React 리렌더링 발생
- 성능 병목 방지를 위해 Mutable Ref로 게임 상태 보관
- UI 업데이트가 필요한 시점(점수 변경, 게임 오버)에만 `forceRender(n => n + 1)` 호출

**트레이드오프:**
- ✅ 렌더링 성능 최적화
- ⚠️ React DevTools로 게임 상태 추적 어려움
- ⚠️ 명시적 `forceRender` 호출 필요

---

### ADR-003: 고정 좌표 공간 + CSS Transform 스케일링

**결정:** 게임 내부 좌표 고정 (640×1035px), 화면 크기에 따라 CSS `transform: scale()` 적용

**이유:**
- Matter.js 물리 계산은 고정 좌표계에서 동작해야 일관성 유지
- 해상도별로 물리 파라미터를 재계산하는 복잡성 회피
- `useResponsive` → `ResizeObserver`로 컨테이너 크기 감지 후 scale 계산

**스케일 공식:**
```
scale = min(containerWidth / 640, containerHeight / 1035)
```

---

### ADR-004: 순수 함수 게임 로직 (React 분리)

**결정:** `src/game/` 폴더의 모든 함수는 React 의존성 없는 순수 함수/모듈

**이유:**
- 게임 로직 단독 테스트 가능
- React 버전 교체나 프레임워크 변경 시 게임 코어 재사용 가능
- 관심사 분리: 물리/렌더링/상태 로직 ↔ React 생명주기

**패턴:**
- `engine.ts` — Matter.js 엔진 생성, 과일 바디 생성/제거 (순수 함수)
- `gameState.ts` — 불변 상태 전환 함수 (`createInitialState`, `addScore` 등)
- `collision.ts` / `controls.ts` — 콜백 주입 방식으로 React와 결합도 최소화

---

### ADR-005: 콜백 주입 이벤트 시스템

**결정:** `collision.ts`, `controls.ts`는 콜백 객체를 매개변수로 받는 setup 함수 제공

**이유:**
- Matter.js 이벤트(충돌)와 DOM 이벤트(마우스/터치)를 React와 느슨하게 결합
- setup 함수는 cleanup 함수를 반환 → React `useEffect`와 자연스럽게 통합

```typescript
// 패턴 예시
const cleanup = setupCollisionHandler(engine, {
  onScore: (points) => { ... },
  onGameOver: () => { ... },
  onMergeEffect: (effect) => { ... },
});
return cleanup; // useEffect cleanup
```

---

### ADR-006: Canvas 2D 커스텀 렌더러 (Matter.js Render 미사용)

**결정:** Matter.js 내장 렌더러 대신 Canvas 2D API로 직접 렌더링 (`renderer.ts`)

**이유:**
- Matter.js 내장 렌더러는 단순 도형만 지원
- 과일별 커스텀 그래픽(체리 꼭지, 포도 질감, 수박 줄무늬 등)이 필요
- 합치기 이펙트(`MergeEffect`), HUD(점수, 다음 과일), 위험선 등 커스텀 UI 요소 필요

---

## 5. 데이터 모델

### GameState (불변 상태 객체)
```typescript
interface GameState {
  phase: GamePhase;          // READY | DROPPING | GAME_OVER
  score: number;
  currentFruitLevel: number; // 현재 드롭할 과일 (0~4, MAX_DROP_LEVEL)
  nextFruitLevel: number;    // 다음 과일 미리보기
}
```

### FruitBody (Matter.js Body 확장)
```typescript
interface FruitBody extends Matter.Body {
  fruitLevel: number;   // 0(체리) ~ 10(수박)
  isMerging: boolean;   // 중복 합치기 방지 플래그
}
```

### FruitConfig (정적 설정)
```typescript
interface FruitConfig {
  name: string;
  radius: number;
  color: string;
  highlight: string;
  scoreValue: number;
  level: number;
  decorations: DecoType[];
  decoColor?: string;
}
```

---

## 6. 게임 루프 흐름

```
requestAnimationFrame (60fps)
         │
         ▼
  useGameLoop callback
         │
         ├─ MergeEffect 업데이트 (radius++, alpha--)
         │
         └─ renderFrame()
               ├─ 배경/컨테이너 그리기
               ├─ Matter.js 바디 위치로 과일 그리기
               ├─ 드롭 가이드라인 (READY 상태)
               ├─ 합치기 이펙트
               ├─ 위험선
               └─ HUD (점수, 최고점, 다음 과일)

Matter.Runner (60fps, 별도 루프)
         │
         ▼
  물리 시뮬레이션 업데이트
         │
         └─ collisionStart 이벤트
               └─ 같은 레벨 과일 충돌 → 합치기 처리
```

---

## 7. 반응형 및 입력 처리

### 반응형 스케일링
- `ResizeObserver`로 컨테이너 크기 변화 감지
- CSS `transform: scale()` + `transformOrigin: 'top center'`
- `touchAction: 'none'` — 브라우저 기본 터치 동작 차단

### 입력 처리 (controls.ts)
| 이벤트 | 동작 |
|--------|------|
| `mousemove` | 과일 위치 이동 |
| `mouseup` | 과일 드롭 |
| `touchstart` | 과일 위치 이동 |
| `touchmove` | 과일 위치 이동 |
| `touchend` | 과일 드롭 |

게임 좌표 변환: 클라이언트 좌표 → 캔버스 좌표 → 과일 반지름 기준 클램핑

---

## 8. 영속성

| 항목 | 저장소 | 키 |
|------|--------|----|
| 최고 점수 | localStorage | `suika-high-score` |

`useLocalStorage` 훅이 직렬화/역직렬화 및 SSR 안전성 처리

---

## 9. 배포 아키텍처

```
GitHub → Vercel (자동 배포)
              │
              ├─ Next.js 빌드
              ├─ 정적 에셋 CDN 배포
              └─ Edge Network (글로벌)
```

- 서버 사이드 로직 없음 (순수 클라이언트 앱)
- API Route 없음
- 데이터베이스 없음

---

## 10. 잠재적 개선 영역

| 항목 | 현황 | 개선 방향 |
|------|------|-----------|
| 점수 리더보드 | 없음 | Supabase/PlanetScale + API Route |
| 테스트 | 없음 | Vitest로 game/ 순수 함수 단위 테스트 |
| 사운드 | 없음 | Web Audio API로 합치기/드롭 효과음 |
| PWA | 없음 | next-pwa로 오프라인 지원 |
| 애니메이션 | CSS Transform | Framer Motion으로 UI 애니메이션 강화 |
