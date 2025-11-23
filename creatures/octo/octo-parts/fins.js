class Fins {
  constructor(parent, r) {
    this.parent = parent;
    this.r = r;
    this.offset = createVector(0, 0);
    this.leftLocal = createVector(-150, 0);
    this.rightLocal = createVector(150, 0);

    this.finCount = 30;

    // 범위
    this.minX = this.r * 0.2;
    this.maxX = this.r;

    // 처음엔 무조건 min에서 시작
    this.currentEllipseX = this.minX;

    // 개체별 속도만 랜덤
    this.speed = random(0.02, 0.06);

    // 애니메이션 시작 시점 (evo 3단계부터)
    this.startFrame = 0;
    this.active = false;   // 아직 진화 3단계 전이면 false
  }

  // 🔥 Octo가 "이제 3단계 됐어"라고 알려줄 때 호출
  startWave() {
    this.active = true;
    this.startFrame = frameCount;  // 이 시점을 기준으로 localFrame 계산
    this.currentEllipseX = this.minX; // 첫 프레임은 항상 min
  }

  setMove(baseMove, factor) {
    this.offset = baseMove.copy().mult(factor);
  }

  getAnchorsLocal() {
    const left = p5.Vector.add(this.leftLocal, this.offset);
    const right = p5.Vector.add(this.rightLocal, this.offset);
    return { left, right };
  }

  // sin으로 진동한 ellipseX가 반영된 지느러미 끝점 좌표 반환
  getEllipseCentersLocal() {
    const centers = [];
    const base = createVector(this.currentEllipseX, 0);
    const step = TWO_PI / this.finCount;

    for (let i = 0; i < this.finCount; i++) {
      const v = base.copy().rotate(i * step);
      v.add(this.offset);
      centers.push(v);
    }
    return centers;
  }

  show() {
    push();
    translate(this.offset.x, this.offset.y);

    let ellipseX = this.minX;

    if (this.active) {
      // 🔥 evo 3단계가 된 이후 경과 프레임(local time)
      const localFrame = frameCount - this.startFrame;

      // localFrame = 0일 때 sin(-PI/2) = -1 → minX에서 시작
      const t = localFrame * this.speed - HALF_PI;
      const sinValue = (sin(t) + 1) * 0.5; // 0~1

      ellipseX = this.minX + sinValue * (this.maxX - this.minX);
    }

    this.currentEllipseX = ellipseX;

    const baseColor = this.parent.c2;
    const rC = red(baseColor);
    const gC = green(baseColor);
    const bC = blue(baseColor);
    const ellipseAlpha = 0.4 * 255;

    const ellipseW = this.r * 0.1;
    const ellipseH = this.r * 0.1;

    for (let i = 0; i < this.finCount; i++) {
      strokeWeight(this.r * 0.18);
      stroke(rC, gC, bC, 0.3 * 255);
      fill(rC, gC, bC, ellipseAlpha);

      ellipse(ellipseX, 0, ellipseW, ellipseH);
      rotate(TWO_PI / this.finCount);
    }

    pop();
  }
}