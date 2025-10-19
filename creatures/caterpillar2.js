class Caterpillar2 extends Creature {
  constructor(position, dna) {
    super(position, dna);

    this.r = this.r * 2;
    this.kind = "Caterpillar";
    this.eats = [];
    this.fears = ["Bug"];

    this.circles = [];
    this.circleCount = floor(random(this.r * 2.5, this.r * 3.5));
    this.lerpAmt = 0.05;

    this.init();

    // this.amplitude = random(10, 20);
    // this.period = random(100, 400);
    // this.w = floor(random(this.r * 2.5, this.r * 3.5));

    // // Wave (x, y, radius, w, amplitude, period, col)
    // this.wave = new Wave(this.position.x, this.position.y, this.r * 2, this.w, this.amplitude, this.period, this.currentColor);
  }

  // // ★ 손 접촉 상태가 전달되면: 기본 깜빡 + wave에도 전달
  // blink(isTouching) {
  //   super.blink(isTouching);
  //   if (this.wave?.blink) this.wave.blink(isTouching);
  // }

  // // ★ 진화 훅: 2단계가 되면 더듬이 타겟을 1로
  // onEvolve(step) {
  //   if (!this.wave) return;

  //   // 단계별 켜기/끄기
  //   this.wave.antTarget = (step >= 2) ? 1 : 0;   // 더듬이(서서히 자람)
  //   this.wave.showFur = (step >= 3);
  //   this.wave.showStripes = (step >= 4);
  //   this.wave.showFeet = (step >= 5);
  // }

  init() {    // 몸통 원 위치 저장 배열 생성
    for (let i = 0; i < this.circleCount; i++) {
      this.circles.push(createVector(this.position.x, this.position.y));
    }
  }

  show() {
    // 몸통의 각 원의 위치 갱신
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


    // 그리기  
    push();
    translate(this.position.x, this.position.y);
    let circleColor = 0;    // black
    // 뒤쪽 원부터 앞으로 그림
    for (let i = this.circles.length - 1; i >= 0; i--) {
      fill(circleColor);
      noStroke();
      circleColor += (255 / this.circleCount);
      ellipse(this.circles[i].x, this.circles[i].y, this.r, this.r);
    }
    fill('rgb(255, 0, 0)');
    circle(this.position.x, this.position.y, this.r);
    pop();

  }
}