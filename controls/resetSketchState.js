function resetSketchState() {
  // 1) 스테이지 다시 1로
  stage = 1;

  // 2) 생태계 상태 재설정
  populationSize = 500;
  reproduceRate = 0.00005;
  mutateRate = 0.01;
  foodSpawnRate = 0.01;
  world = new World(populationSize);

  // 3) 배경/그라데이션 관련 값 초기화
  backgroundColor = color('#1b1b1bff');
  bgFrom = color(STAGE4_PALETTE[0]);
  bgTo = color(STAGE4_PALETTE[1]);
  bgIdx = 1;
  bgT = 0;

  // 4) stage4 타이머도 같이 리셋
  stage4StartMs = null;
  stage5StartMs = null;
  isFadingToStage5 = false;
  fadeStartMs = null;

  // 5) BGM도 stage 1 기준으로 다시 설정 (원하면)
  ensureAudio();
  playStageMusic(stage);

  // 필요하면 zoom 상태, hand 관련 상태도 일부 리셋 가능
  zoom = 1.0;
  targetZoom = 1.0;

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
    15,
    [
      { x: width * 0.30, y: height * 0.35, strength: 2.0, radius: 200, rot: -HALF_PI }, // 큰
      { x: width * 0.80, y: height * 0.50, strength: 1.0, radius: 100, rot: HALF_PI }, // 중
      { x: width * 0.40, y: height * 0.80, strength: 0.9, radius: 150, rot: -HALF_PI }, // 작은
    ]
  );
}