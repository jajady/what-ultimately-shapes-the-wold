class Octo extends Creature {
  constructor(position, dna) {
    super(position, dna);

    this.kind = "Octo";
    this.eats = ["Bug", "Caterpillar"];
    this.fears = [""];

    // 파츠들 생성
    this.head = new OctoHead(this.r);                    // 얼굴 원
    this.eyes = new OctoEyes(this.r * 0.66);             // 눈 + 눈동자
    this.mouth = new OctoMouth(this, this.r * 0.4);

    // 이 값들은 update()에서 계산해서 각 파츠에게 줌
    this.moveVec = createVector(0, 0);
    this.lookDir = createVector(0, 0);  // 눈이 부드럽게 따라가게 할 때 씀


    // 시각적 요소(Decorations)
    this.showBlusher = false;   // 볼터치
    this.showEarShadow = false; // 귀 음영
    this.showEyelash = false;   // 속눈썹
    this.showFeet = false;      // 발
    this.showHat = false;       // 모자
    this.showArc = false; // 겉에 호 그리기

  }


  // ★ 진화 훅
  onEvolve(step) {
    // 2단계: 블러셔, 귀음영 추가,  속눈썹
    this.showBlusher = (step >= 2);
    this.showEarShadow = (step >= 2);
    this.showEyelash = (step >= 2);
    this.showFeet = (step >= 3);
    this.showHat = (step >= 4);
    this.showArc = (step >= 5);
  }

  update() {
    super.update();

    // 1) 개체의 움직임
    let move = this.velocity.copy();

    // 속도가 0에 가까우면 눈이 흔들리니까 부드럽게
    if (move.mag() > 0.0001) {
      // 눈이 얼굴 밖으로 튀어나가지 않도록 얼굴 크기 기준으로 제한
      move.setMag(this.r * 0.8);   // 얼굴 반지름의 25%만 이동
      this.moveVec = move;
    }

    // (선택) 프레임마다 튀는 거 싫으면 이렇게 스무딩
    this.lookDir.lerp(this.moveVec, 0.04);   // 0.2는 반응속도

    // 2) 각 파츠에 “얼마나 따라갈지” 알려주기
    // 파츠마다 비율이 다름 (원래 코드랑 같은 값)
    // this.ears.setMove(move, -0.3);       // 귀는 반대 방향으로 살짝
    this.eyes.setMove(move, 0.5);    // 눈은 0.5배, 눈동자는 20px 제한
    // this.nose.setMove(move, 0.7);
    this.mouth.setMove(move, 0.5);
    // this.eyebrows.setMove(move, 0.6);
    // this.hair.setMove(move, 0.3);
    this.mouth.update();
  }

  show() {
    // 1) 버프 스케일
    const s = this.getVisualScale();
    const r = this.r * s;

    // === 지속 후광 ===
    if (this.isHalo) {
      push();
      noStroke();
      const pulse = 0.6 + 0.4 * sin(frameCount * 0.05); // 살짝 숨쉬듯 펄스
      const alpha = 90 + 60 * pulse; // 알파값 변화
      fill(209, 255, 176, alpha);    // 연초록 빛 후광
      ellipse(this.position.x, this.position.y, this.r * 4.5, this.r * 4.5);  // 후광
      pop();
    }

    // === 힐 연결선: 머리에서 시작 ===
    if (this._healTarget) {
      const a = this.position;
      const b = this._healTarget.position;

      const pulse = 0.5 + 0.5 * sin(frameCount * 0.1);
      const alpha = 50 * pulse;

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

    // === 본체 그리기 ===
    push();
    noStroke();
    translate(this.position.x, this.position.y);

    /* ── 발(3단계~) ── */
    if (this.showFeet) {
      push();
      translate(-r * 0.3, r * 1);
      rotate(PI / 4);
      fill(this.c4);
      ellipse(0, 0, r * 0.6, r * 1);
      pop();

      push();
      translate(r * 0.3, r * 1);
      rotate(-PI / 4);
      fill(this.c4);
      ellipse(0, 0, r * 0.6, r * 1);
      pop();
    }

    /* ── 모자(4단계~) ── */
    if (this.showHat) {
      strokeJoin(ROUND);
      strokeCap(ROUND);
      strokeWeight(0.5);
      fill(this.c3);
      triangle(r * 0.2, -r * 2, r * 1, -r * 0.5, -r * 1, -r * 0.5);
      fill(this.currentColor);
      circle(r * 0.2, -r * 2, r * 0.25);
      noStroke();
    }

    /* ── 몸통 ── */
    fill(this.currentColor);
    this.head.show();

    /* ── 블러셔(2단계~) ── */
    if (this.showBlusher) {
      push();
      translate(r * 0.6, 0);
      fill(this.c2);
      ellipse(0, 0, r * 0.5, r * 0.2);
      pop();

      push();
      translate(-r * 0.6, 0);
      fill(this.c2);
      ellipse(0, 0, r * 0.5, r * 0.2);
      pop();
    }

    this.mouth.show();
    this.eyes.show();

    /* ── 외곽 호(5단계~) ── */
    if (this.showArc) {
      noFill();
      stroke(this.c2);
      strokeWeight(0.5);
      arc(0, 0, r * 3.75, r * 3.75, -PI / 3, PI / 4);
      arc(0, 0, r * 4.3, r * 4.3, PI / 8, PI / 3);
      arc(0, 0, r * 3.75, r * 3.75, PI * 4 / 6, PI * 7 / 6);
      arc(0, 0, r * 4.3, r * 4.3, PI * 6.5 / 6, PI * 8.2 / 6);
      noStroke();
    }

    pop(); // ← 본체 translate 블록 종료

    // ★ 눈에게 현재 터치 상태 전달 (Octo에만 eyes가 있으므로 여기서 연결)
    if (this.eyes && typeof this.eyes.setTouching === 'function') {
      this.eyes.setTouching(this.touching);
    }

  }
}