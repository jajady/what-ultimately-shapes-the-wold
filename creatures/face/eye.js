// eye.js
class Eye {
  constructor(parent, offsetX, offsetY, widthMult, heightMult) {
    this.parent = parent;       // Creature/Caterpillar2 참조
    this.offsetX = offsetX;     // 부모 '반지름' 기준 오프셋
    this.offsetY = offsetY;
    this.widthMult = widthMult;
    this.heightMult = heightMult;

    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.irisWBase = 0;
    this.irisHBase = 0;
    this.irisW = 0;
    this.irisH = 0;

    // 깜빡임 상태
    this.eyeOpen = 1.0;
    this._blinkPhase = 0;
    this._blinkSpeed = 0.25;

    // (옵션) 시선 이동용 내부 오프셋
    this._pupilDX = 0;
    this._pupilDY = 0;
  }

  // isTouching을 넘기지 않으면 parent.touching을 사용
  update(isTouching) {
    // 1) 깜빡임 애니메이션
    const touching = (typeof isTouching === 'boolean') ? isTouching : !!this.parent.touching;
    const dtFactor = (typeof deltaTime === 'number' ? deltaTime / 16.6667 : 1); // ~60fps 기준 보정

    if (touching) {
      this._blinkPhase += this._blinkSpeed;
      this.eyeOpen = (1 + Math.cos(this._blinkPhase)) * 0.5; // 1..0..1
      if (this._blinkPhase >= TWO_PI) this._blinkPhase -= TWO_PI;
    } else {
      this.eyeOpen = lerp(this.eyeOpen, 1, 0.25);
    }

    const headPos = this.parent.circles[0];
    const baseR = (this.parent.r * 0.5);  // 부모 반지름
    this.x = headPos.x + baseR * this.offsetX;
    this.y = headPos.y + baseR * this.offsetY;

    // 눈 크기(Headset 기준 비율 재사용)
    this.w = this.parent.r * this.widthMult;
    const eyeHBase = this.parent.r * this.heightMult;
    this.h = eyeHBase * this.eyeOpen;

    this.irisWBase = this.w * 0.35;
    this.irisHBase = eyeHBase * 0.375;
    this.irisW = this.irisWBase;
    this.irisH = this.irisHBase * this.eyeOpen;
  }

  show() {
    noStroke();
    fill(0);
    ellipseMode(CENTER);
    ellipse(this.x, this.y, this.w, this.h);

    const irisCol = this.parent?.currentColor || color(255);
    fill(irisCol);
    ellipse(this.x, this.y - this.irisH * 0.3, this.irisW, this.irisH);
  }
}