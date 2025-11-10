// ---------------- FlowField ----------------
class FlowField {
  constructor(r, centers) {
    this.resolution = r;
    this.cols = floor(width / this.resolution);
    this.rows = floor(height / this.resolution);

    // centers: [{ x, y, strength, radius, rot }]
    this.centers = centers || [];
    this.field = Array.from({ length: this.cols }, () => new Array(this.rows));
    this.colorIdx = Array.from({ length: this.cols }, () => new Array(this.rows));

    // 색 인덱스는 '한 번만' 랜덤으로 정해 둔다
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        this.colorIdx[i][j] = floor(random(3)); // 0: 분홍, 1: 연두, 2: 초록
      }
    }
    this.init();
  }

  init() {
    const eps = 1e-6;
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const w = width / this.cols;
        const h = height / this.rows;
        const x = i * w + w * 0.5;
        const y = j * h + h * 0.5;

        let sum = createVector(0, 0);

        for (const c of this.centers) {
          let v = createVector(c.x - x, c.y - y);     // 중심 -> 격자점
          const d2 = max(v.x * v.x + v.y * v.y, eps);

          // 접선 방향(원운동): rot로 90도 회전(시계:-HALF_PI, 반시계:HALF_PI)
          const rot = (c.rot !== undefined) ? c.rot : -HALF_PI;
          v.rotate(rot);

          const sigma = max(1, (c.radius ?? 150));
          const wgt = (c.strength ?? 1) * Math.exp(-d2 / (2 * sigma * sigma));

          v.setMag(wgt);
          sum.add(v);
        }

        if (sum.magSq() < 1e-12) sum = createVector(1, 0).setMag(0.001);

        sum.normalize();
        this.field[i][j] = sum;
      }
    }
  }

  show() {
    const PALETTE = [
      { r: 255, g: 105, b: 180 }, // 분홍
      { r: 144, g: 238, b: 144 }, // 연두
      { r: 255, g: 255, b: 0 },   // 노랑
    ];

    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        let w = width / this.cols;
        let h = height / this.rows;
        let dir = this.field[i][j].copy();
        dir.setMag(w * 0.5);
        let x = i * w + w / 2;
        let y = j * h + h / 2;

        const c = PALETTE[this.colorIdx[i][j]]; // 고정된 색 사용
        stroke(c.r, c.g, c.b, 150);
        strokeWeight(0.7);
        push();
        translate(x, y);
        const a = createVector(-dir.x, -dir.y);
        const b = createVector(dir.x, dir.y);
        line(a.x, a.y, b.x * 200, b.y * 200);    // !!! 이 라인!!!!
        // const L = dir.copy().rotate(-3 / 4 * PI).setMag(5);
        // const R = dir.copy().rotate(3 / 4 * PI).setMag(5);
        // line(b.x, b.y, b.x + L.x, b.y + L.y);
        // line(b.x, b.y, b.x + R.x, b.y + R.y);
        pop();
      }
    }

    // (옵션) 중심 시각화
    // noStroke();
    // for (const c of this.centers) {
    //   fill(0, 100);
    //   circle(c.x, c.y, 6);
    // }
  }

  lookup(position) {
    const c = constrain(floor(position.x / this.resolution), 0, this.cols - 1);
    const r = constrain(floor(position.y / this.resolution), 0, this.rows - 1);
    return this.field[c][r].copy();
  }
}