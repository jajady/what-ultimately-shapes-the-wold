class Fins {
  constructor(parent, r) {
    this.parent = parent;
    this.r = r;
    this.offset = createVector(0, 0);
    this.leftLocal = createVector(-150, 0);
    this.rightLocal = createVector(150, 0);

    this.finCount = 20;
  }

  setMove(baseMove, factor) {
    this.offset = baseMove.copy().mult(factor);
  }

  getAnchorsLocal() {
    const left = p5.Vector.add(this.leftLocal, this.offset);
    const right = p5.Vector.add(this.rightLocal, this.offset);
    return { left, right };
  }

  // ✅ 지느러미 ellipse 중심들의 "Octo 로컬 좌표"를 돌려주는 함수
  getEllipseCentersLocal() {
    const centers = [];
    const rectLX = this.r;
    const base = createVector(rectLX, 0);     // 회전 전 기준점
    const step = TWO_PI / this.finCount;

    for (let i = 0; i < this.finCount; i++) {
      const v = base.copy().rotate(i * step); // 각도만큼 회전
      v.add(this.offset);                     // fins.offset만큼 평행 이동
      centers.push(v);
    }
    return centers;
  }

  show() {
    push();
    translate(this.offset.x, this.offset.y);

    const rectLX = this.r;
    const rectLY = - this.r * 0.025;
    const rectRX = 0;
    const rectRY = this.r * 0.025;
    const ellipseW = this.r * 0.1;
    const ellipseH = this.r * 0.1;

    for (let i = 0; i < this.finCount; i++) {
      strokeWeight(1);
      stroke('rgba(100, 150, 255, 0.5)');
      // fill('rgba(100, 150, 255, 0.5)');
      // if (i === 0) {
      //   fill('lightpink');
      // }
      // rectMode(CORNERS);
      // rect(rectLX, rectLY, rectRX, rectRY);
      fill('rgba(198, 216, 255, 1)');
      ellipse(rectLX, 0, ellipseW, ellipseH);

      rotate(TWO_PI / this.finCount);
    }
    pop();
  }
}