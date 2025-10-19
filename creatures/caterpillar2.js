class Caterpillar2 extends Creature {
  constructor(position, dna) {
    super(position, dna);

    this.r = this.r * 1.5;
    this.kind = "Caterpillar";
    this.eats = [];
    this.fears = ["Bug"];

    this.circles = [];
    this.circleCount = 20;
    // this.circleCount = floor(random(this.r * 2.5, this.r * 3.5));
    this.lerpAmt = 0.2;
    this.init();

    // Eye(parent, offsetX, offsetY, widthMult, heightMult)
    this.leftEye = new Eye(this, -0.35, -0.2, 0.15, 0.3);    // 눈
    this.rightEye = new Eye(this, 0.35, -0.2, 0.15, 0.3);

    // Mouth(parent, offsetX, offsetY, widthMult, heightMult)
    this.mouth = new Mouth(this, 0, 0.2, 0.15, 0.1);
  }

  update() {
    super.update();
    this.bodyUpdate();    // 몸 내부 업데이트
  }

  bodyUpdate() {
    // 몸의 각 원의 위치 갱신
    if (this.isBorder) {     // 경계면 넘어에 있을 때
      for (let i = 0; i < this.circles.length; i++) {
        this.circles[i].x = this.position.x;
        this.circles[i].y = this.position.y;
      }
      this.isBorder = false;
    } else {
      for (let i = 0; i < this.circles.length; i++) {
        if (i === 0) {    // 맨 앞 원
          this.circles[i].x = lerp(this.circles[i].x, this.position.x, this.lerpAmt);
          this.circles[i].y = lerp(this.circles[i].y, this.position.y, this.lerpAmt);
        }
        else {        // 나머지 원들은 앞 원의 위치를 따라감
          this.circles[i].x = lerp(this.circles[i].x, this.circles[i - 1].x, this.lerpAmt);
          this.circles[i].y = lerp(this.circles[i].y, this.circles[i - 1].y, this.lerpAmt);
        }
      }
    }
    this.mouth.update();
  }

  // ✅ Creature.checkPetting()이 매 프레임 이걸 호출함
  blink(isTouching) {
    this.leftEye.update(isTouching);
    this.rightEye.update(isTouching);
  }

  show() {
    // 1) 버프 스케일
    const s = this.getVisualScale();
    const r = this.r * s;

    // === 지속 후광 ===
    if (this.isHalo) {
      noStroke();
      const pulse = 0.6 + 0.4 * sin(frameCount * 0.05); // 살짝 숨쉬듯 펄스
      const alpha = 90 + 60 * pulse; // 알파값 변화
      fill(209, 255, 176, alpha);    // 연초록 빛 후광
      ellipse(this.position.x, this.position.y, r * 1.8, r * 1.8);
    }

    // === 힐 연결선: 머리에서 시작 ===
    if (this._healTarget) {
      const a = this.position;        // ← 머리 월드 좌표
      const b = this._healTarget.position;

      const pulse = 0.5 + 0.5 * sin(frameCount * 0.3);
      const alpha = 180 * pulse;

      push();
      stroke(red(this.c2), green(this.c2), blue(this.c2), alpha);
      strokeWeight(max(1, this.r * 0.12));
      line(a.x, a.y, b.x, b.y);

      // 선을 따라 이동하는 점
      const dotT = (millis() - this._healStartMs) / 400.0;
      const frac = dotT - floor(dotT);
      const px = lerp(a.x, b.x, frac);
      const py = lerp(a.y, b.y, frac);
      noStroke();
      fill(this.c3);
      circle(px, py, this.r * 0.35);
      pop();
    }

    // 본체 그리기
    noStroke();
    ellipseMode(CENTER);
    // 가장 뒤쪽(꼬리) 색은 검정으로 시작하고,
    // 가장 앞쪽(머리)은 currentColor 그대로
    const baseColor = backgroundColor;   // 뒤쪽(가장 어두운 색)
    const headColor = this.currentColor;  // 앞쪽(가장 밝은 색)

    for (let i = this.circles.length - 1; i >= 0; i--) {
      // i가 작을수록(머리 쪽) 밝고, 클수록(꼬리 쪽) 어둡게
      const amt = map(i, this.circles.length - 1, 0, 0, 1);
      const bodyColor = lerpColor(baseColor, headColor, amt);

      fill(bodyColor);
      ellipse(this.circles[i].x, this.circles[i].y, r, r);
    }

    // 눈 그리기
    this.leftEye.show();
    this.rightEye.show();

    // 입
    this.mouth.show();
  }

  init() {    // 몸통 원 위치 저장 배열 생성
    for (let i = 0; i < this.circleCount; i++) {
      this.circles.push(createVector(this.position.x, this.position.y));
    }
  }
}