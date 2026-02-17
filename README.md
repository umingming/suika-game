# 🍉 수박게임 (Suika Game)

> 과일을 합쳐서 수박을 만들어보세요!

물리 엔진 기반의 반응형 웹 수박게임입니다. 같은 과일끼리 부딪히면 더 큰 과일로 합쳐지며, 최종 목표는 수박을 만드는 것입니다.

## 🎮 게임 규칙

1. 화면 위에서 과일을 떨어뜨립니다
2. **같은 종류의 과일**이 만나면 다음 단계 과일로 합쳐집니다
3. 합칠 때마다 점수를 획득합니다
4. 과일이 위험선을 넘으면 게임 오버!

### 과일 진화 순서

```
🍒 체리 → 🍓 딸기 → 🍇 포도 → 🍊 데코폰 → 🍑 감 → 🍎 사과 → 🍐 배 → 🍑 복숭아 → 🍍 파인애플 → 🍈 멜론 → 🍉 수박
```

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | **Next.js 16** |
| 언어 | **TypeScript** (strict mode) |
| 물리 엔진 | **Matter.js** |
| 스타일링 | **Tailwind CSS 4** |
| 패키지 매니저 | **pnpm** |

## 📁 프로젝트 구조

```
src/
├── app/                  # Next.js 앱 라우터
│   ├── layout.tsx        # 루트 레이아웃
│   ├── page.tsx          # 메인 페이지
│   └── globals.css       # 글로벌 스타일
├── components/
│   ├── GameCanvas.tsx    # 메인 게임 캔버스
│   └── GameLoader.tsx    # 동적 로더 (SSR 비활성화)
├── game/
│   ├── engine.ts         # Matter.js 엔진 세팅
│   ├── renderer.ts       # 캔버스 렌더링 (과일 그래픽)
│   ├── collision.ts      # 충돌 감지 & 합치기 로직
│   ├── controls.ts       # 마우스/터치 입력 처리
│   ├── gameState.ts      # 상태 관리
│   ├── fruits.ts         # 과일 설정 (11단계)
│   └── constants.ts      # 게임 상수
├── hooks/
│   ├── useGameEngine.ts  # 물리 엔진 초기화
│   ├── useGameLoop.ts    # 애니메이션 루프
│   ├── useLocalStorage.ts # 로컬 스토리지
│   └── useResponsive.ts  # 반응형 스케일링
└── types/
    └── game.ts           # 타입 정의
```

## 🚀 실행 방법

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start
```
