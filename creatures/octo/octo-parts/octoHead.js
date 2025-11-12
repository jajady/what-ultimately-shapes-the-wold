// ====================== Head (얼굴 원) ======================
class OctoHead {
  constructor(parent, r) {
    this.parent = parent;
    this.r = r;   // Face 인스턴스 참조 저장
  }

  show() {
    fill(this.parent.currentColor);
    ellipse(0, 0, this.r, this.r);   // 얼굴 본체
  }
}