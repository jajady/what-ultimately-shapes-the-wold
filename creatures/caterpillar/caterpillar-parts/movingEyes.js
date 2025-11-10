class MovingEyes {
  constructor(r) {
    // 눈 전체 위치 이동
    this.offset = createVector(0, 0);
    // 눈동자 이동 (눈 안에서의 상대 위치)
    this.pupilOffset = createVector(0, 0);

    // 눈 크기 관련
    this.r = r;
    this.pupilLimit = this.r * 0.7; // 눈동자가 너무 멀리 안 움직이게 제한

    // 깜빡임 관련 상태
    this.eyeOpen = 1.0;     // 눈 열림 정도 (1=완전 열림, 0=완전 감김)
    this._touching = false; // 손이 닿았는지 여부
    this._blinking = false; // 깜빡임 중인지
    this._blinkStart = 0;   // 깜빡임 시작 시각(ms)
    this._blinkDur = 800;   // 한 번 깜빡이는 데 걸리는 시간 (닫→열)
    this._blinkGap = 700;   // 깜빡이고 나서 다음 깜빡까지 대기 시간
  }

  // 외부에서 얼굴의 움직임 벡터를 받아 눈 이동과 눈동자 위치 갱신
  setMove(baseMove, factor) {
    this.offset = baseMove.copy().mult(factor);   // 전체 눈 위치 이동
    this.pupilOffset = baseMove.copy();           // 눈동자만 따로 이동
    this.pupilOffset.limit(this.pupilLimit);      // 눈 밖으로 못 나가게 제한
  }

  // caterpiller이 손 닿음 여부를 전달할 때 호출
  setTouching(flag) {
    this._touching = !!flag;
    if (!this._touching) this._blinking = false;  // 손을 떼면 깜빡임 멈춤
  }

  // 깜빡임 시작 시각 기록
  _startBlink(now = millis()) {
    this._blinking = true;
    this._blinkStart = now;
  }

  // 매 프레임마다 깜빡임 상태 업데이트
  _updateBlink() {
    const now = millis();

    if (this._touching) {  // 손이 닿아 있을 때만 깜빡임 활성
      if (!this._blinking) this._startBlink(now); // 아직 안 깜빡이면 시작
      const t = (now - this._blinkStart) / this._blinkDur; // 0~1 비율

      if (t >= 1) {  // 깜빡임 한 주기 끝났으면
        this._blinking = false;
        // 일정 시간 지나면 다시 깜빡임 시작
        if (now - this._blinkStart >= this._blinkDur + this._blinkGap) {
          this._startBlink(now);
        }
        // 깜빡임 쉬는 구간에는 눈을 서서히 다시 뜸
        this.eyeOpen = lerp(this.eyeOpen, 1.0, 0.35);
      } else {
        // sin파형으로 눈 감기/열기 자연스럽게 (닫→열)
        const closePhase = sin(PI * t); // 0→1→0
        this.eyeOpen = 1.0 - closePhase;
      }
    } else {
      // 손이 닿지 않으면 천천히 눈이 완전히 열림
      this._blinking = false;
      this.eyeOpen = lerp(this.eyeOpen, 1.0, 0.2);
    }
  }

  // 눈과 눈동자 그리기
  show() {
    this._updateBlink(); // 먼저 깜빡임 상태 갱신

    push();
    translate(this.offset.x, this.offset.y); // 눈 전체 이동

    // 눈 크기 계산
    const r = this.r;
    const eyeGap = r * 0.5;           // 양쪽 눈 간 거리
    const baseEyeW = r * 0.5;         // 눈 폭
    const baseEyeH = r;               // 눈 높이(전체 크기)
    const eyeH = baseEyeH * this.eyeOpen; // 눈 감기 정도 반영

    const pupilW = r * 0.25;
    const pupilH = (r * 0.4) * this.eyeOpen; // 눈 감기면 동공도 작게

    // 눈(검은 부분)
    fill('black');
    ellipse(-eyeGap, 0, baseEyeW, eyeH); // 왼쪽 눈
    ellipse(eyeGap, 0, baseEyeW, eyeH);  // 오른쪽 눈

    // 눈동자(하얀 부분)
    push();
    translate(this.pupilOffset.x * (r / 100), this.pupilOffset.y * (r / 100));
    fill('white');
    ellipse(-eyeGap, -pupilH * 0.3, pupilW, pupilH);
    ellipse(eyeGap, -pupilH * 0.3, pupilW, pupilH);
    pop();

    pop();
  }


}