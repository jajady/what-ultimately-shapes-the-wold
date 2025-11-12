// 먹이를 먹는 생명체들의 세상
// 많이 먹을수록, 더 오래 생존합니다.
// 오래 생존할수록, 번식할 확률이 높아집니다.
// 몸집이 클수록, 먹이를 덮기 쉬워집니다.
// 몸집이 클수록, 먹이를 찾기 위해 더 느리게 움직입니다.
// 생명체가 죽으면, 그 자리에 먹이가 남습니다.

// 스테이지(1~4)
// 1: 닿으면 각 객체 반응
// 2: 닿으면 즉시 이타성 개체(isAltruist)
// 3: 닿으면 즉시 자유의지 개체(hasFreeWill)
// 4: (필요 시 자유 연출/휴지기 등으로 활용)


//---- 생태계 ----//
let stage;
let world;
let foodSpawnRate;  // 먹이 생길 확률
let populationSize;  // 인구수
let reproduceRate;      // 번식 확률
let mutateRate;       // 돌연변이 확률

let margin;     // 화면 마진
let backgroundColor;
let toColor;
let handPosition;
let rHand;

// ── 추가: 전역 흐름장
let flowfield;

// ---- stage4 배경 그라데이션용 ----
let bgFrom, bgTo, bgT = 0;
let bgIdx = 0;
const BG_SPEED = 0.002;  // 느리게(부드럽게) 바뀜. 0.002~0.01 사이로 취향 조절
const STAGE4_PALETTE = [
  '#004ad4', // 파랑
  '#009fcfff', // 시안
  '#00c98dff', // 민트
  '#faaf00ff', // 옐로
  '#f33965ff', // 핑크/레드
];

function setup() {
  //  const W = 1920, H = 1080;
  const W = 1080, H = 720;
  createCanvas(W, H);
  video = createCapture({
    video: {
      width: W,
      height: H
    },
    audio: false
  });
  video.size(W, H);   // 기본: 640 × 480 픽셀 (4:3 비율)
  video.hide();
  Object.values(tracks).forEach(s => {
    s.setLoop(true);
    s.setVolume(0);   // 처음엔 0으로
  });
  handPose.detectStart(video, gotHands);  // 손 감지를 시작합니다. ml5 ver.

  margin = 200;           // 화면 마진 

  stage = 1;        // 스테이지 1로 초기화
  populationSize = 500;       // 인구수
  // reproduceRate = 0.0005;        // 번식 확률 실험
  reproduceRate = 0.00005;        // 번식 확률
  mutateRate = 0.01          // 돌연변이 확률
  foodSpawnRate = 0.01;     // 먹이가 생길 확률

  world = new World(populationSize);

  backgroundColor = color('#030303');
  rHand = 50;  // 손 크기

  // Create particle emitters for each hand keypoint
  for (let i = 0; i < MAX_HANDS; i++) {
    emitters.push(new Emitter(width / 2, height / 2));
  }

  zoomCenter = { x: width / 2, y: height / 2 };
  lastZoomCenter = { x: width / 2, y: height / 2 };
  textFont('system-ui, -apple-system, Segoe UI, Roboto, sans-serif');
  noCursor();   // 커서 숨김

  // ── 흐름장 초기화(센터 3개: 큰/중/작)
  flowfield = new FlowField(
    20,
    [
      { x: width * 0.30, y: height * 0.35, strength: 2.0, radius: 200, rot: -HALF_PI }, // 큰
      { x: width * 0.80, y: height * 0.50, strength: 1.0, radius: 100, rot: HALF_PI }, // 중
      { x: width * 0.40, y: height * 0.80, strength: 0.9, radius: 150, rot: -HALF_PI }, // 작은
    ]
  );

  backgroundColor = color('#1b1b1bff');

  // stage4 배경 보간 초기값 설정
  bgFrom = color(STAGE4_PALETTE[0]);
  bgTo = color(STAGE4_PALETTE[1]);
  bgIdx = 1;
  bgT = 0;
}


function draw() {
  // === 거울 모드(좌우 반전) ===
  push();
  translate(width, 0);
  scale(-1, 1);

  if (stage === 4) {
    // smoothstep 이징으로 bgFrom→bgTo 보간
    const u = bgT;
    const t = u * u * (3 - 2 * u); // smoothstep
    backgroundColor = lerpColor(bgFrom, bgTo, t);
    background(backgroundColor);

    // 진행
    bgT += BG_SPEED;
    if (bgT >= 1) {
      bgT = 0;
      bgFrom = bgTo;
      bgTo = _pickNextStage4Color(); // 다음 색으로 계속 루프
    }
  } else {
    background(backgroundColor);
  }

  updateZoomState();
  // 렌더 & 역변환에서 같은 값 쓰도록 먼저 보간
  zoom = lerp(zoom, targetZoom, ZOOM_SMOOTH);

  // --- 손 포인트 수집 (화면 좌표) ---
  // !!! 여기서 'let' 빼고 전역을 덮어씁니다. (shadowing 금지)
  handPoints = [];
  if (hands.length > 0) {
    for (const hand of hands) {
      if (hand.confidence > 0.1) {
        const tip = getKP(hand, 'index_finger_tip') || hand.keypoints?.[8];
        if (tip) handPoints.push({ x: tip.x, y: tip.y });
      }
    }
  }

  // --- 화면 → 월드 좌표 역변환 (여기를 꼭 만들어야 Creature가 볼 수 있음) ---
  handPointsWorld = handPoints.map(screenToWorld);

  // --- 월드 렌더(줌 적용) ---
  const cx = lastZoomCenter.x, cy = lastZoomCenter.y;
  push();
  translate(cx, cy);
  scale(zoom);
  translate(-cx, -cy);
  // stage 4에서 파란 배경 위로 흐름장(벡터 화살표) 그리기
  if (stage === 4 && flowfield) {
    flowfield.show();

  }
  world.run();
  pop();

  // (선택) 손 오버레이 파티클
  for (let i = 0; i < emitters.length; i++) {
    const e = emitters[i];
    const p = handPoints[i];
    if (p) {
      e.origin.x = p.x;
      e.origin.y = p.y;
      if ((frameCount & 1) === 0) e.addParticle();
    }
    e.run();
  }

  pop();

}

// --- 스테이지 전환 ---
function keyPressed() {
  // 1) 스페이스: stage===4 일 때만 흐름장 디버그 토글
  // if (key === ' ' || keyCode === 32) {
  //   debug = !debug;
  //   console.log('flowfield debug:', debug);
  //   return; // 스페이스 처리는 여기서 끝
  // }

  // 2) 스테이지 전환
  if (key === '1') {
    stage = 1;
    ensureAudio();
    playStageMusic(stage);
  } else if (key === '2') {
    stage = 2;
    ensureAudio();
    playStageMusic(stage);
  } else if (key === '3') {
    stage = 3;
    ensureAudio();
    playStageMusic(stage);
  } else if (key === '4') {
    stage = 4;
    ensureAudio();
    playStageMusic(stage);
    // 여기엔 스페이스 체크 넣지 마세요!
  } else if (key === '0') {
    if (currentTrack) { fadeOutAndStop(currentTrack, 10.0); currentTrack = null; }
  }
  console.log('stage →', stage);

  if (key === 's' || key === 'S') {  // 소문자 s, 대문자 S 둘 다 인식
    saveCanvas('screenshot.png');  // 파일명 screenshot.png로 저장
  }
}

function _pickNextStage4Color() {
  bgIdx = (bgIdx + 1) % STAGE4_PALETTE.length;
  return color(STAGE4_PALETTE[bgIdx]);
}
