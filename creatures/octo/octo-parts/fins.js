class Fins {
  constructor(parent, r) {
    this.parent = parent;
    this.r = r;
    this.offset = createVector(0, 0);
    // 로컬 좌표에서의 앵커(지느러미 중심) 위치
    this.leftLocal = createVector(-150, 0);
    this.rightLocal = createVector(150, 0);

    this.finCount = 20;
  }

  setMove(baseMove, factor) {
    this.offset = baseMove.copy().mult(factor);
  }

  // 현재 프레임에서의 앵커(월드 좌표 아님: Head 안에서 translate 후 쓰거나,
  // Head가 pos를 더해서 월드로 변환하면 됨)
  getAnchorsLocal() {
    // 회전 5번 그리는 건 시각 효과이고, 꼬리는 기본 방향의 중심을 따른다고 가정
    const left = p5.Vector.add(this.leftLocal, this.offset);
    const right = p5.Vector.add(this.rightLocal, this.offset);
    return { left, right };
  }

  show() {
    push();
    translate(this.offset.x, this.offset.y);
    const rectX = this.r * 0.5;
    const rectW = this.r;
    const rectH = this.r * 0.05;
    const ellipseW = this.r * 0.1;
    const ellipseH = this.r * 0.1;

    for (let i = 0; i < this.finCount; i++) {
      strokeWeight(1);
      stroke('rgba(100, 150, 255, 0.5)');
      fill('rgba(100, 150, 255, 0.5)');
      if (i === 0) {
        fill('lightpink');
      }
      rectMode(CENTER);
      rect(rectX, 0, rectW, rectH);    //  지느러미 뼈대
      fill('rgba(198, 216, 255, 1)');
      ellipse((rectX + rectW / 2), 0, ellipseW, ellipseH);    // 지느러미 끝점

      rotate(TWO_PI / this.finCount);
    }
    pop();
  }
}