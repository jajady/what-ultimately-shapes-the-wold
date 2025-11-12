class CaterpillarTail {
  constructor(parent, r) {
    this.parent = parent;
    this.r = r;   // Face 인스턴스 참조 저장

    this.circles = [];
    this.circleCount = 20;
    // this.circleCount = floor(random(this.r * 2.5, this.r * 3.5));
    this.lerpAmt = 0.2;
    this.init();
  }

  init() {    // 몸통 원 위치 저장 배열 생성
    for (let i = 0; i < this.circleCount; i++) {
      this.circles.push(createVector(0, 0));
    }
  }

  update() {
    // 몸의 각 원의 위치 갱신
    if (this.parent.isBorder) {     // 경계면 넘어에 있을 때
      for (let i = 0; i < this.circles.length; i++) {
        this.circles[i].set(0, 0);            // ✅ 벡터 리셋
      }
      this.parent.isBorder = false;
    } else {
      for (let i = 0; i < this.circles.length; i++) {
        if (i === 0) {    // 맨 앞 원
          this.circles[i].x = lerp(this.circles[i].x, this.parent.position.x, this.lerpAmt);
          this.circles[i].y = lerp(this.circles[i].y, this.parent.position.y, this.lerpAmt);
        }
        else {        // 나머지 원들은 앞 원의 위치를 따라감
          this.circles[i].x = lerp(this.circles[i].x, this.circles[i - 1].x, this.lerpAmt);
          this.circles[i].y = lerp(this.circles[i].y, this.circles[i - 1].y, this.lerpAmt);
        }
      }
    }
  }

  show() {
    const baseColor = backgroundColor;       // 뒤쪽 색
    const headColor = this.parent.currentColor;     // 얼굴색
    const r = this.r;
    ellipseMode(CENTER);
    noStroke();

    for (let i = this.circles.length - 1; i >= 0; i--) {
      const amt = map(i, this.circles.length - 1, 0, 0, 1);
      const bodyColor = lerpColor(baseColor, headColor, amt);
      // fill('bodyColor');
      fill('lightpink');
      ellipse(this.circles[i].x, this.circles[i].y, r, r);
    }
  }
}