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
let stage4StartMs = null;
let isFadingToStage5 = false;
let fadeStartMs = null;
let stage5StartMs = null;
const STAGE4_TO_STAGE5_DELAY = 120000;   // 2분 = 120,000ms
const STAGE4_FADE_DURATION = 3000;       // 페이드아웃 3초
const STAGE5_DURATION = 5000;            // 엔딩 화면 5초
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
  '#0059ffff', // 파랑
  '#009fcfff', // 시안
  '#00c98dff', // 민트
  '#faaf00ff', // 옐로
  '#ff6388ff', // 핑크/레드
];

function setup() {
  textFont('Pretendard');
  //  const W = 1920, H = 1080;
  const W = 1280, H = 720;
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

  resetSketchState();
}


function draw() {
  // === Stage 5: 엔딩 화면 ===
  if (stage === 5) {
    // background(color('#1b1b1bff'));
    background(color('#000000'));

    // 텍스트 스타일
    fill(255);
    textAlign(CENTER, CENTER);
    textFont('Pretendard SemiBold');
    textSize(36);
    text('마침내 세계를 이루는 것들', width / 2, height / 2 - 25);

    textFont('Pretendard');
    textSize(18);
    text('정세은', width / 2, height / 2 + 27);
    textSize(12);
    text('Graduation Project \nDepartment of Design Convergence \nHongik University', width / 2, height / 2 + 70);

    // 5초 지나면 리셋
    if (stage5StartMs && millis() - stage5StartMs >= STAGE5_DURATION) {
      resetSketchState();
    }
    return; // 👈 stage 5에서는 여기서 끝
  }

  // === 거울 모드(좌우 반전) ===
  push();
  translate(width, 0);
  scale(-1, 1);

  if (stage === 4) {
    if (stage4StartMs === null) {
      stage4StartMs = millis();
    }
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

    // 🔹 2분 지나면 페이드 시작
    const elapsed4 = millis() - stage4StartMs;
    if (!isFadingToStage5 && elapsed4 >= STAGE4_TO_STAGE5_DELAY) {
      isFadingToStage5 = true;
      fadeStartMs = millis();
    }
  } else {
    background(backgroundColor);
    stage4StartMs = null;
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

  // === stage 4 페이드아웃 오버레이 ===
  if (stage === 4 && isFadingToStage5 && fadeStartMs !== null) {
    const now = millis();
    let fadeT = (now - fadeStartMs) / STAGE4_FADE_DURATION;
    fadeT = constrain(fadeT, 0, 1);

    // '#1b1b1bff'로 점점 덮기
    const base = color('#1b1b1bff');
    const r = red(base);
    const g = green(base);
    const b = blue(base);
    const a = 255 * fadeT; // 0 → 255

    push();
    noStroke();
    fill(r, g, b, a);
    // 거울 모드로 캔버스가 뒤집힌 상태에서 그렸으니,
    // 전체 화면 덮으려면 이렇게
    rect(0, 0, width, height);
    pop();

    // 페이드 다 끝났으면 stage 5로 전환
    if (fadeT >= 1) {
      stage = 5;
      stage5StartMs = millis();
      isFadingToStage5 = false;
      fadeStartMs = null;
      // 배경색도 엔딩용으로 확정
      backgroundColor = color('#1b1b1bff');
    }
  }

  pop();

}

// --- 스테이지 전환 ---
function keyPressed() {
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
    stage4StartMs = null;
    isFadingToStage5 = false;
    fadeStartMs = null;
    // 여기엔 스페이스 체크 넣지 마세요!
  } else if (key === '5') {
    stage = 5;
    stage5StartMs = millis();     // ✅ 5 눌러도 5초 타이머 시작
    isFadingToStage5 = false;     // 혹시 남아있을지 모를 플래그 정리
    fadeStartMs = null;
    backgroundColor = color('#1b1b1bff');

    // 필요하면 음악도 꺼주기
    if (currentTrack) {
      fadeOutAndStop(currentTrack, 2.0);
      currentTrack = null;
    }
  } else if (key === '0') {
    if (currentTrack) { fadeOutAndStop(currentTrack, 10.0); currentTrack = null; }
  }
  console.log('stage →', stage);

  if (key === 's' || key === 'S') {  // 소문자 s, 대문자 S 둘 다 인식
    saveCanvas('screenshot.png');  // 파일명 screenshot.png로 저장
  }

  if (key === 'r' || key === 'R') {
    resetSketchState();
  }
}

function _pickNextStage4Color() {
  bgIdx = (bgIdx + 1) % STAGE4_PALETTE.length;
  return color(STAGE4_PALETTE[bgIdx]);
}


