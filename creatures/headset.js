class Headset extends Creature {
  constructor(position, dna) {
    super(position, dna);

    this.kind = "Headset";
    this.eats = ["Bug", "Caterpillar"];
    this.fears = ["Octopus"];

    // mouth pulse
    this._wasTouchedFood = false;
    this._pulseSeq = [];
    this._pulse = null; // { start, mult, up, hold, down }
    this._big = { up: 18, hold: 8, down: 22 };
    this._small = { up: 14, hold: 6, down: 18 };

    this.leftEye = new Eye(this);         // 눈
    this.rightEye = new Eye(this);
    // 눈은 base blink가 관리 → 초기값만 있으면 됨
    this.eyeOpen = 1.0;

    // ★ 귀 회전 상태
    this._earAngle = 0;     // 현재 귀 회전각 (radians)
    this._earEase = 0.1;    // 보간(부드럽게) 정도 (0~1)

    // 시각적 요소(Decorations)
    this.showBlusher = false;   // 볼터치
    this.showEarShadow = false; // 귀 음영
    this.showEyelash = false;   // 속눈썹
    this.showFeet = false;      // 발
    this.showHat = false;       // 모자
    this.showArc = false; // 겉에 호 그리기
  }

  _startEatPulseSequence() {
    this._pulseSeq = [
      { mult: 3, ...this._big },
      { mult: 2, ...this._small },
      { mult: 2, ...this._small },
      { mult: 2, ...this._small },
      { mult: 2, ...this._small },
    ];
    this._pulse = null;
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

  show() {
    // 1) 버프 스케일
    const s = this.getVisualScale();

    // 2) 먹이 상승 에지 → 펄스 시퀀스
    if (this.touchedFood && !this._wasTouchedFood) this._startEatPulseSequence();
    this._wasTouchedFood = this.touchedFood;

    // 3) 현재 펄스 없으면 큐에서 꺼내기
    if (!this._pulse && this._pulseSeq.length > 0) {
      const next = this._pulseSeq.shift();
      this._pulse = { start: frameCount, ...next };
    }

    // 이징
    const easeUp = (t) => (1 - Math.cos(Math.PI * t)) / 2;
    const easeDown = (t) => (1 - Math.cos(Math.PI * t)) / 2;

    // 4) 입(세로) 스케일 (펄스)
    let mouthScale = 1.0;
    if (this._pulse) {
      const { start, mult, up, hold, down } = this._pulse;
      const elapsed = frameCount - start;
      const total = up + hold + down;

      if (elapsed <= total) {
        if (elapsed <= up) {
          const t = elapsed / up;
          mouthScale = 1 + (mult - 1) * easeUp(t);
        } else if (elapsed <= up + hold) {
          mouthScale = mult;
        } else {
          const t = (elapsed - up - hold) / down;
          const k = easeDown(t);
          mouthScale = mult - (mult - 1) * k;
        }
      } else {
        this._pulse = null;
        mouthScale = 1.0;
      }
    }

    // === 그리기 시작 ===
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

    // 형체 그리기
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
    circle(0, 0, r * 2);

    // 이동 방향 → 귀 회전 목표
    const th = PI / 12;
    let targetAngle = 0;
    if (this.velocity.x > 0.2) targetAngle = th;
    if (this.velocity.x < -0.2) targetAngle = -th;
    this._earAngle = lerp(this._earAngle, targetAngle, this._earEase);

    // 눈 치수
    const eyeCxL = -r * 0.25, eyeCxR = r * 0.25, eyeCy = -r * 0.33;
    const eyeW = r * 0.25, eyeH = r * 0.5 * this.eyeOpen;
    const irisW = r * 0.10, irisH = r * 0.20 * this.eyeOpen;

    // 속눈썹(2단계~)
    if (this.showEyelash) {
      const lidTopY = eyeCy - eyeH * 0.5;
      const nearCenter = eyeCy - r * 0.05;
      const t = 1 - this.eyeOpen;
      const lashEndY = lerp(lidTopY, nearCenter, constrain(t, 0, 1));
      const lashLen = r * 0.12;

      stroke(0);
      strokeWeight(max(0.5, r * 0.01));
      noFill();
      line(eyeCxL, eyeCy, eyeCxL - lashLen, lashEndY);
      line(eyeCxR, eyeCy, eyeCxR + lashLen, lashEndY);
      noStroke();
    }

    // 눈 (좌/우)
    fill(0);
    ellipse(eyeCxL, eyeCy, eyeW, eyeH);
    fill(this.currentColor);
    ellipse(eyeCxL, eyeCy - r * 0.07, irisW, irisH);

    fill(0);
    ellipse(eyeCxR, eyeCy, eyeW, eyeH);
    fill(this.currentColor);
    ellipse(eyeCxR, eyeCy - r * 0.07, irisW, irisH);

    /* ── 귀 ── */
    // 왼쪽 귀
    push();
    fill(this.currentColor);
    translate(-r, 0);
    rotate(this._earAngle);
    ellipse(0, 0, r * 0.5, r * 2.5);
    if (this.showEarShadow) {      // 귀 음영(2단계~)
      fill(this.c3);
      ellipse(0, -r * 0.3, r * 0.2, r * 0.8);
    }
    pop();

    // 오른쪽 귀
    push();
    fill(this.currentColor);
    translate(r, 0);
    rotate(this._earAngle);
    ellipse(0, 0, r * 0.5, r * 2.5);
    if (this.showEarShadow) {
      fill(this.c3);
      ellipse(0, -r * 0.3, r * 0.2, r * 0.8);
    }
    pop();

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

    /* ── 입 펄스 ── */
    const topY = r * 0.20;
    const baseH = r * 0.15;
    const mouthH = baseH * mouthScale;
    const bottomY = topY + mouthH;
    const halfW = r * 0.3;
    let cornerR = constrain(mouthH * 0.6, 1, min(halfW, mouthH) - 0.5);
    fill(0);
    rectMode(CORNERS);
    rect(-halfW, topY, halfW, bottomY, 0, 0, cornerR, cornerR);

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

    pop();
  }
}