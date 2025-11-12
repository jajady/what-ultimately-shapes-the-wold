class OctoMouth {
  constructor(parent, r) {
    this.parent = parent;
    this.r = r;   // 75
    this.offset = createVector(0, 0);
    // 입 열림 정도 (1 = 기본, >1 = 크게 벌어짐)
    this.open = 1.0;

    // 씹기(펄스) 상태
    this._wasTouchedFood = false;
    this._chewing = false;
    this._chewStart = 0;
    this._chewDur = 280;   // 한 번 ‘쩝’ 하는 시간(ms)
    this._chewGap = 120;   // 다음 씹기까지 쉬는 시간(ms)
    this._chewMax = 4;     // 한 번 먹을 때 최대 몇 번 씹을지
    this._chewCount = 0;
    this._openAmp = 1.0;   // 입이 얼마나 크게 벌어질지 (1.0 = 2배 정도)
  }

  setMove(baseMove, factor) {
    this.offset = baseMove.copy().mult(factor);
  }

  _startChew(now = millis()) {
    this._chewing = true;
    this._chewStart = now;
    this._chewCount = 0;
  }

  update() {
    const p = this.parent;
    if (!p) return;

    // ① 먹이 닿는 순간(상승 에지)에서 씹기 시퀀스 시작
    const eatingNow = !!p.touchedFood;
    if (eatingNow && !this._wasTouchedFood) {
      this._startChew();
    }
    this._wasTouchedFood = eatingNow;

    const now = millis();

    // ② 씹기 애니메이션 (MovingEyes 깜빡임과 거의 같은 패턴)
    if (this._chewing) {
      const t = (now - this._chewStart) / this._chewDur; // 0→1

      if (t <= 1) {
        // sin 파형: 0→1→0 으로 한 번 열렸다 닫히는 느낌
        const phase = sin(PI * t);     // 0→1→0
        this.open = 1 + phase * this._openAmp; // 1→(1+amp)→1
      } else {
        // 씹기 한 번 끝났음: 잠깐 쉬면서 다시 기본값으로 복귀
        this.open = lerp(this.open, 1.0, 0.3);

        // 충분히 쉬었으면 다음 씹기 시작 or 종료
        if (now - this._chewStart >= this._chewDur + this._chewGap) {
          this._chewCount++;
          if (this._chewCount >= this._chewMax) {
            this._chewing = false;     // 다 씹었으면 종료
          } else {
            this._chewStart = now;     // 다음 씹기 시작
          }
        }
      }
    } else {
      // 씹고 있지 않을 땐 천천히 기본 모양으로
      this.open = lerp(this.open, 1.0, 0.2);
    }

  }

  show() {
    push();
    translate(this.offset.x, this.offset.y);
    const mouthY = this.r * 1.4;
    const mouthW = this.r;
    const mouthH = this.r * 0.4 * this.open;

    fill(this.parent.bl);
    ellipse(0, mouthY, mouthW, mouthH);   // 입
    pop();
  }
}