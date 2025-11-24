class Caterpillar extends Creature {
  constructor(position, dna) {
    super(position, dna);

    // this.r = this.r * 2;
    this.kind = "Caterpillar";
    this.eats = [];
    this.fears = ["Bug"];

    this.circles = [];
    this.circleCount = this.r * 2;
    this.lerpAmt = 0.2;
    this.init();

    // 🔹 눈/입의 "기준 크기"를 따로 저장
    this.eyeBaseR = this.r * 0.33;
    this.mouthBaseR = this.r * 0.2;

    // 파츠들 생성
    this.eyes = new CaterpillarEyes(this, this.eyeBaseR);
    this.mouth = new CaterpillerMouth(this, this.mouthBaseR);

    // 이 값들은 update()에서 계산해서 각 파츠에게 줌
    this.moveVec = createVector(0, 0);
    this.lookDir = createVector(0, 0);  // 눈이 부드럽게 따라가게 할 때 씀

    // 더듬이 상태 (0=없음, 1=완전 성장)
    this.antAmount = 0;        // 현재 값
    this.antTarget = 0;        // 목표 값
    this.antSpeed = 0.06;     // 성장/축소 속도
    this.antLenMul = 0.8;  //  길이
    this.antSpreadMul = 0.2;  // 좌우 간격
    this.antBulgeMul = 0.28;  // 곡률
    this.antTipMul = 0.12;  // 끝 구슬 크기

    // 표시 플래그 (기본은 꺼둠)
    this.showFur = false;      // 털
    this.showStripes = false;  // 줄무늬
    this.showFeet = false;     // 발
  }

  update() {
    super.update();
    this.bodyUpdate();    // 몸 내부 업데이트

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
    this.eyes.setMove(move, 0.3);
    this.mouth.setMove(move, 0.25);
    this.mouth.update();
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
    // ★ 더듬이 양 보간
    this.antAmount = lerp(this.antAmount, this.antTarget, this.antSpeed);
  }

  // ★ 진화 훅: 2단계가 되면 더듬이 타겟을 1로
  onEvolve(step) {
    // 단계별 켜기/끄기
    this.antTarget = (step >= 2) ? 1 : 0;   // 더듬이(서서히 자람)
    this.showFur = (step >= 3);
    this.showStripes = (step >= 4);
    this.showFeet = (step >= 5);
  }

  show() {
    // 1) 버프 스케일
    const s = this.getVisualScale();
    const r = this.r * s;
    const x = this.position.x;
    const y = this.position.y;

    // 🔹 level 때문에 커진 비율 (레벨 없으면 1)
    const levelScale = this.baseR > 0 ? (this.r / this.baseR) : 1;

    // 🔹 눈/입도 레벨 + 버프 스케일 모두 반영
    if (this.eyes) {
      this.eyes.r = this.eyeBaseR * levelScale * s;
      this.eyes.pupilLimit = this.eyes.r;   // 동공 이동 제한도 같이 스케일
    }
    if (this.mouth) {
      this.mouth.r = this.mouthBaseR * levelScale * s;
    }

    // === 지속 후광 ===
    if (this.isHalo) {
      noStroke();
      const pulse = 0.6 + 0.4 * sin(frameCount * 0.05); // 살짝 숨쉬듯 펄스
      const alpha = 90 + 60 * pulse; // 알파값 변화
      fill(209, 255, 176, alpha);    // 연초록 빛 후광
      ellipse(this.position.x, this.position.y, r * 1.8, r * 1.8);
    }

    // === 힐 연결선: 머리에서 시작 ===
    if (this._healTarget && stage === 3) {
      const a = this.position;        // ← 머리 월드 좌표
      const b = this._healTarget.position;

      const pulse = 0.5 + 0.5 * sin(frameCount * 0.02);
      const alpha = 50 * pulse;

      stroke(red(this.c2), green(this.c2), blue(this.c2), alpha);
      strokeWeight(max(1, this.r * 0.12));
      line(a.x, a.y, b.x, b.y);

      // 선을 따라 이동하는 점
      const dotT = (millis() - this._healStartMs) / 3200;
      const frac = dotT - floor(dotT);
      const px = lerp(a.x, b.x, frac);
      const py = lerp(a.y, b.y, frac);
      noStroke();
      fill(this.c3);
      heart(px, py, this.r * 0.35);
    }

    // ───────── 1) 몸통(꼬리→머리 바로 앞까지) ─────────
    const baseColor = backgroundColor;       // 뒤쪽 색
    const headColor = this.currentColor;     // 머리 쪽 색
    ellipseMode(CENTER);
    noStroke();

    // 머리는 index 0. 1..len-1만 즉, 머리 제외 몸통 먼저 그림
    for (let i = this.circles.length - 1; i >= 1; i--) {
      const amt = map(i, this.circles.length - 1, 0, 0, 1);
      const bodyColor = lerpColor(baseColor, headColor, amt);


      // 털
      if (this.showFur) {
        push();
        translate(this.circles[i].x, this.circles[i].y);
        rotate(PI * 1 / 2);
        rotate(PI * -1 / 16);
        fill(this.c2);
        rectMode(CORNERS);
        rect(0, 0, -this.r * s * 0.7, -this.r * s * 0.1, 5);
        rotate(PI * 1 / 8);
        rect(0, 0, -this.r * s * 0.7, -this.r * s * 0.1, 5);
        pop();
      }

      // ★ 발: 진화 3단계에서
      if (this.showFeet) {
        push();
        translate(this.circles[i].x, this.circles[i].y);
        fill(this.c2);
        ellipse(0, this.r * s * 0.5, this.r * s * 0.25, this.r * s * 0.4);
        pop();
      }

      // 줄무늬
      if (this.showStripes) {
        push();
        translate(this.circles[i].x, this.circles[i].y);

        if (i % 2 === 0) {    // 세로 줄 번갈아 나타내기
          stroke(this.c3);
          strokeWeight(0.3 * s);   // 스트로크 ->  세로 줄 있음
          ellipse(0, 0, r, r);
        } else {
          noStroke();             // 세로 줄 없음
          fill(bodyColor);
          ellipse(0, 0, r, r);
        }

        fill(this.c4);
        rotate(PI * 2 / 6);       // 점
        circle(0, this.r * -0.4 * s, this.r * s * 0.1 * s);
        rotate(PI * 2 / 6);
        circle(0, this.r * -0.4 * s, this.r * s * 0.1 * s);
        rotate(PI * 4 / 6);
        circle(0, this.r * -0.4 * s, this.r * s * 0.1 * s);
        rotate(PI * 2 / 6);
        circle(0, this.r * -0.4 * s, this.r * s * 0.1 * s);
        pop();
      } else {
        fill(bodyColor);
        ellipse(this.circles[i].x, this.circles[i].y, r, r);  // defalt 상태 몸통
      }
    }

    // ───────── 2) 더듬이(얼굴 그리기 직전) ─────────
    if (this.antAmount > 0.01) {
      const grow = pow(this.antAmount, 0.85);
      const len = this.r * (this.antLenMul * grow * s);
      const spread = this.r * this.antSpreadMul;
      const bulge = this.r * this.antBulgeMul;

      stroke(this.currentColor);
      strokeWeight(max(1, this.r * 0.04 * s));
      noFill();

      // 왼쪽
      beginShape();
      vertex(x - spread, y - this.r * 0.15);
      quadraticVertex(x - spread - bulge * 0.3, y - bulge * 0.5,
        x - spread - bulge * 0.15, y - len);
      endShape();

      // 오른쪽
      beginShape();
      vertex(x + spread, y - this.r * 0.15);
      quadraticVertex(x + spread + bulge * 0.3, y - bulge * 0.5,
        x + spread + bulge * 0.15, y - len);
      endShape();

      // 끝 구슬
      noStroke();
      fill(this.currentColor);
      const tipD = this.r * this.antTipMul;
      circle(x - spread - bulge * 0.15, y - len, tipD);
      circle(x + spread + bulge * 0.15, y - len, tipD);
    }

    // ───────── 3) 얼굴(= circles[0]) ─────────
    fill(this.currentColor);
    ellipse(this.circles[0].x, this.circles[0].y, r, r);

    // ───────── 4) 눈/입 ─────────
    push();
    // translate(this.position.x, this.position.y);
    translate(this.circles[0].x, this.circles[0].y);   // ✅ 얼굴 중심과 동일한 원점
    this.eyes.show();
    this.mouth.show();
    pop();


    // ★ 눈에게 현재 터치 상태 전달 (Octo에만 eyes가 있으므로 여기서 연결)
    if (this.eyes && typeof this.eyes.setTouching === 'function') {
      this.eyes.setTouching(this.touching);
    }

  }

  init() {    // 몸통 원 위치 저장 배열 생성
    for (let i = 0; i < this.circleCount; i++) {
      this.circles.push(createVector(this.position.x, this.position.y));
    }
  }
}