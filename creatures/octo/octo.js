class Octo extends Creature {
  constructor(position, dna) {
    super(position, dna);

    this.headBaseR = this.r;
    this.eyeBaseR = this.r * 0.33;
    this.mouthBaseR = this.r * 0.2;
    this.finsBaseR = this.r * 2;

    // 파츠들 생성
    this.head = new OctoHead(this, this.headBaseR);
    this.eyes = new OctoEyes(this, this.eyeBaseR);
    this.mouth = new OctoMouth(this, this.mouthBaseR);
    this.fins = new Fins(this, this.finsBaseR);

    // 이 값들은 update()에서 계산해서 각 파츠에게 줌
    this.moveVec = createVector(0, 0);
    this.lookDir = createVector(0, 0);  // 눈이 부드럽게 따라가게 할 때 씀


    // 시각적 요소(Decorations)
    this.showBlusher = false;   // 볼터치
    this.showEyelash = false;   // 속눈썹
    this._finsWaveStarted = false;
  }


  // ★ 진화 훅
  onEvolve(step) {
    // 2단계: 블러셔, 귀음영 추가,  속눈썹
    this.showBlusher = (step >= 4);

    if (step >= 3 && !this._finsWaveStarted) {
      if (this.fins && typeof this.fins.startWave === 'function') {
        this.fins.startWave();
      }
      this._finsWaveStarted = true;
    }
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
    // this.ears.setMove(move, -0.3);       // 귀는 반대 방향
    this.eyes.setMove(move, 0.3);    // 눈은 0.5배, 눈동자는 20px 제한
    this.mouth.setMove(move, 0.25);
    this.mouth.update();
    this.fins.setMove(move, -1.25);
  }

  show() {
    // 1) 버프 스케일
    const s = this.getVisualScale();
    const r = this.r * s;
    const levelScale = this.baseR > 0 ? (this.r / this.baseR) : 1;

    // 버프스케일, level에 따라 커지는 r값 적용
    if (this.head) this.head.r = this.headBaseR * levelScale * s;
    if (this.eyes) {
      this.eyes.r = this.eyeBaseR * levelScale * s;
      this.eyes.pupilLimit = this.eyes.r;
    }
    if (this.mouth) this.mouth.r = this.mouthBaseR * levelScale * s;

    // === 지속 후광 ===
    if (this.isHalo) {
      push();
      noStroke();
      const pulse = 0.6 + 0.4 * sin(frameCount * 0.05); // 살짝 숨쉬듯 펄스
      const alpha = 90 + 60 * pulse; // 알파값 변화
      fill(209, 255, 176, alpha);    // 연초록 빛 후광
      ellipse(this.position.x, this.position.y, this.r * 1.8, this.r * 1.8);  // 후광
      pop();
    }

    // === 힐 연결선: 따뜻한 빛이 살살 퍼져가고, 도착점에서 1초 머무르는 효과 ===
    if (this._healTarget && stage === 3) {
      const a = this.position;               // 힐 보내는 쪽 (나)
      const b = this._healTarget.position;   // 힐 받는 대상

      // 🔸 한 사이클 = 이동 3초 + 도착지점에서 1초 머무름
      const travelDur = 3000; // ms, 빛이 a→b 로 이동하는 데 걸리는 시간
      const holdDur = 1000; // ms, b 에서 머무는 시간
      const cycleDur = travelDur + holdDur;

      const elapsed = (millis() - this._healStartMs) % cycleDur;
      const isHolding = (elapsed > travelDur);  // 도착지점에서 머무는 구간인지?

      let travelT;
      if (isHolding) {
        travelT = 1;                    // 도착 지점에서 고정
      } else {
        travelT = elapsed / travelDur;  // 0 → 1 로 천천히 이동
      }

      // 현재 빛 덩어리 위치
      const px = lerp(a.x, b.x, travelT);
      const py = lerp(a.y, b.y, travelT);

      push();

      // 1) 전체 라인에 옅은 빛 기운만 깔아두기
      const baseBeamAlpha = 18;
      const beamCol = color(255, 230, 200, baseBeamAlpha);
      stroke(beamCol);
      strokeWeight(max(1, this.r * 0.06));
      line(a.x, a.y, b.x, b.y);

      // ADD 블렌딩으로 빛 번짐 느낌
      blendMode(ADD);
      noStroke();

      const baseSize = this.r * 1.2;

      if (!isHolding) {
        // ───── 이동 중일 때: 살살 퍼져나가는 트레일 ─────
        const trailCount = 2;        // 잔상 개수
        const trailStep = 0.08;      // 한 잔상마다 시간 간격

        for (let i = 0; i < trailCount; i++) {
          const backT = travelT - i * trailStep;
          if (backT < 0) continue;

          const bx = lerp(a.x, b.x, backT);
          const by = lerp(a.y, b.y, backT);

          const falloff = 1.0 - i / trailCount;                 // 뒤로 갈수록 약해짐
          const sizeMul = 1.4 + i * 0.035;                       // 뒤로 갈수록 더 크고 흐려짐
          const alphaMul = 0.6 * falloff;                       // 뒤로 갈수록 더 투명
          const pulse = 0.8 + 0.2 * sin(frameCount * 0.1);      // 숨쉬듯 살짝 변동

          // 바깥 후광
          fill(255, 240, 210, 40 * alphaMul);
          ellipse(bx, by, baseSize * sizeMul * 1.8 * pulse, baseSize * sizeMul * 1.8 * pulse);
        }

        // 가장 앞쪽 현재 빛 덩어리 – 조금 더 또렷하게
        const pulse = 0.9 + 0.1 * sin(frameCount * 0.15);
        fill(255, 225, 190, 120);
        ellipse(px, py, baseSize * 0.9 * pulse, baseSize * 0.9 * pulse);

        fill(255, 245, 220, 210);
        ellipse(px, py, baseSize * 0.55 * pulse, baseSize * 0.55 * pulse);

      } else {
        // ───── 도착 지점에서 1초 머무는 구간 ─────
        // travelT = 1 이라 항상 b 에 머무는 상태
        const holdNorm = (elapsed - travelDur) / holdDur;   // 0 ~ 1
        const pulse = 0.85 + 0.25 * sin(frameCount * 0.12);

        // 도착 지점에서 더 크게, 더 부드럽게 퍼지는 빛
        fill(255, 240, 210, 70);
        ellipse(b.x, b.y,
          baseSize * 2.2 * pulse,
          baseSize * 2.2 * pulse
        );

        fill(255, 225, 190, 140);
        ellipse(b.x, b.y,
          baseSize * 1.4 * pulse,
          baseSize * 1.4 * pulse
        );

        fill(255, 250, 230, 230);
        ellipse(b.x, b.y,
          baseSize * 0.7 * pulse,
          baseSize * 0.7 * pulse
        );

        // 도착지점 주변에 아주 살짝 흩어지는 입자들
        for (let i = 0; i < 4; i++) {
          const offset = p5.Vector.random2D().mult(this.r * 0.45 * random(0.3, 1.0));
          const dotSize = this.r * random(0.07, 0.14);
          fill(255, 250, 230, 150);
          ellipse(b.x + offset.x, b.y + offset.y, dotSize, dotSize);
        }
      }

      // 이동/정지 상관없이, 현재 코어 주변에 약간의 작은 알갱이
      const coreX = isHolding ? b.x : px;
      const coreY = isHolding ? b.y : py;
      for (let i = 0; i < (isHolding ? 3 : 2); i++) {
        const offset = p5.Vector.random2D().mult(this.r * 0.35 * random(0.2, 0.9));
        const dotSize = this.r * random(0.05, 0.1);
        fill(255, 250, 235, isHolding ? 170 : 130);
        ellipse(coreX + offset.x, coreY + offset.y, dotSize, dotSize);
      }

      blendMode(BLEND);
      pop();
    }

    // === 본체 그리기 ===
    push();
    translate(this.position.x, this.position.y);

    // 진화 3단계 이상일 때만 line 활성화
    if (this.evolutionStep >= 3) {
      this.fins.show();
      const finCenters = this.fins.getEllipseCentersLocal();

      const hex = this.c2.toString('#rrggbb');
      stroke(hex + 'aa');                // 동일 색 + 알파
      strokeWeight(this.r * 0.18);

      for (const p of finCenters) {
        line(0, 0, p.x, p.y);
      }
    }
    noStroke();

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

    /* ── 머리 ── */
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

    // fill('red');
    // circle(0, 0, this.r * 0.5);
    pop(); // ← 본체 translate 블록 종료

    // ★ 눈에게 현재 터치 상태 전달 (Octo에만 eyes가 있으므로 여기서 연결)
    if (this.eyes && typeof this.eyes.setTouching === 'function') {
      this.eyes.setTouching(this.touching);
    }

    // push();
    // fill('red');
    // noStroke();
    // textSize(10);
    // textAlign(CENTER);
    // if (this.anchorRank > 0) {
    //   text(`L${this.anchorRank}`, this.position.x, this.position.y - this.r - 10);
    // }
    // pop();

  }
}