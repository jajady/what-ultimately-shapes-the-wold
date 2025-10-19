class Caterpillar extends Creature {
  constructor(position, dna) {
    super(position, dna);

    this.r = this.r * 1.3;
    this.kind = "Caterpillar";
    this.eats = [];
    this.fears = ["Bug"];

    this.amplitude = random(10, 20);
    this.period = random(100, 400);
    this.w = floor(random(this.r * 2.5, this.r * 3.5));

    // Wave (x, y, radius, w, amplitude, period, col)
    this.wave = new Wave(this.position.x, this.position.y, this.r * 2, this.w, this.amplitude, this.period, this.currentColor);
  }

  // ★ 손 접촉 상태가 전달되면: 기본 깜빡 + wave에도 전달
  blink(isTouching) {
    super.blink(isTouching);
    if (this.wave?.blink) this.wave.blink(isTouching);
  }

  // ★ 진화 훅: 2단계가 되면 더듬이 타겟을 1로
  onEvolve(step) {
    if (!this.wave) return;

    // 단계별 켜기/끄기
    this.wave.antTarget = (step >= 2) ? 1 : 0;   // 더듬이(서서히 자람)
    this.wave.showFur = (step >= 3);
    this.wave.showStripes = (step >= 4);
    this.wave.showFeet = (step >= 5);
  }

  show() {
    const s = this.getVisualScale();

    // wave 동기화
    this.wave.c = this.currentColor;
    this.wave.c2 = this.c2;
    this.wave.c3 = this.c3;
    this.wave.c4 = this.c4;
    this.wave.x = this.position.x;
    this.wave.y = this.position.y;
    this.wave.r = this.r * s;
    this.wave.w = max(this.wave.w, this.r * 2 * s);
    this.wave.amplitude = this.amplitude * (0.9 + 0.2 * s);
    if (this.touchedFood) this.wave.bite();

    // 파형 업데이트(머리 위치 계산 전에!)
    this.wave.update();

    // 머리 위치 (후광과 힐 선 모두 여기서 사용)
    const headPos = this.wave.getHeadWorldPos();

    // === 지속 후광 ===
    if (this.isHalo) {
      push();
      noStroke();
      const pulse = 0.6 + 0.4 * sin(frameCount * 0.05); // 살짝 숨쉬듯 펄스
      const alpha = 90 + 60 * pulse; // 알파값 변화
      fill(209, 255, 176, alpha);    // 연초록 빛 후광
      ellipse(headPos.x, headPos.y, this.wave.r * 1.8, this.wave.r * 1.8);
      pop();
    }

    // === 힐 연결선: 머리에서 시작 ===
    if (this._healTarget) {
      const a = this.wave.getHeadWorldPos();        // ← 머리 월드 좌표
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
    this.wave.show();
  }
}