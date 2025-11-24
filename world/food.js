// 먹이 모음
class Food {
  constructor(num) {
    this.foodPositions = [];    // 각 먹이 위치 저장
    this.r = [];                // 각 먹이 크기 저장
    this.colors = [];           // ★ 각 먹이의 색상 저장 (추가)
    this.maxR = 1.5;              // 최대 반지름(숫자 상수)
    this.growProb = 0.01;       // 아이템별 프레임당 성장 확률

    // 사용할 색상 목록
    const colorList = [
      color('#d1b7ccff'),
      color('#d9cbc0ff'),
      color('#c0bbd0ff')
    ];

    for (let i = 0; i < num; i++) {
      this.foodPositions.push(createVector(random(width), random(height)));
      // this.foodPositions.push(randomPosInCenterDisk());
      this.r.push(0.5);
      // ★ 색상 중 하나를 랜덤하게 선택
      const c = random(colorList);
      this.colors.push(c);
    }
  }

  // 특정 위치에 먹이를 추가합니다
  add(position) {
    this.foodPositions.push(position.copy());
    this.r.push(0.5);

    // ★ 새 먹이도 랜덤 색상 부여
    const colorList = [
      color('#d1b7ccff'),
      color('#d9cbc0ff'),
      color('#c0bbd0ff')
    ];
    this.colors.push(random(colorList));
  }

  // 먹이를 화면에 표시하고 관리합니다
  run() {
    stroke(0);
    strokeWeight(1);

    for (let i = 0; i < this.foodPositions.length; i++) {
      const pos = this.foodPositions[i];
      const rad = this.r[i];
      const c = this.colors[i]; // ★ 해당 먹이 색상 가져오기

      push();
      translate(pos.x, pos.y);

      // 꽃잎
      const petalCount = 8;
      const step = TWO_PI / petalCount;
      fill(c);  // ★ 각 먹이 고유 색상으로 채우기
      noStroke();
      // 제 1사분면부터 시계방향으로
      roundedQuad(rad, -rad * 2, rad * 2.5, -rad * 3, rad * 3, -rad, 0, 0, rad * 1.5, rad * 0.1, rad, rad * 0.1);
      roundedQuad(rad * 2.5, rad * 0.2, rad * 3.5, rad * 1.5, rad, rad * 1.8, 0, 0, rad * 1.5, rad * 0.1, rad, rad * 0.1);
      roundedQuad(rad * 0.5, rad * 2, rad * 0.2, rad * 3.8, rad * (-1), rad * 2.5, 0, 0, rad * 1.5, rad * 0.1, rad, rad * 0.1);
      roundedQuad(rad * -2.5, rad * 2, rad * -4, rad * -0.2, rad * -2, rad * -1, 0, 0, rad * 1.5, rad * 0.1, rad, rad * 0.1);
      roundedQuad(rad * (-1.5), rad * (-2), rad * (-1), rad * (-3.3), rad * (0.5), rad * (-2.5), 0, 0, rad * 1.5, rad * 0.1, rad, rad * 0.1);

      // 꽃 중심
      fill('#f9f9f9ff');
      circle(0, 0, rad * 1.5);
      const filamentColor = color('#ebde49ff');    // 수술 줄기
      const antherColor = color('#e39a73ff');   // 꽃밥

      stroke(filamentColor);     // 수술1
      strokeWeight(rad * 0.25);
      bezier(0, 0, 0, 0, rad * -0.2, rad * -0.8, rad * -0.2, rad * -0.8);
      noStroke();
      fill(antherColor);
      ellipse(rad * -0.2, rad * -0.8, rad * 0.5, rad);

      stroke(filamentColor);      // 수술2
      strokeWeight(0.5);
      bezier(rad * 0.3, rad * -0.2, rad * 0.3, rad * -0.2, rad, rad * 0.5, rad, rad * 0.5);
      noStroke();
      fill(antherColor);
      ellipse(rad, rad * 0.5, rad * 0.5, rad);

      stroke(filamentColor);     // 수술3
      strokeWeight(0.5);
      bezier(rad * 0.2, rad * 0.2, rad * 0.2, rad * 0.2, rad * 0.5, rad * 1, rad * 0.5, rad * 1);
      noStroke();
      fill(antherColor);
      ellipse(rad * 0.5, rad * 1, rad * 0.5, rad);

      stroke(filamentColor);     // 수술4
      strokeWeight(0.5);
      bezier(rad * -0.2, rad * 0.3, rad * -0.2, rad * 0.3, rad * -0.7, rad * 0.5, rad * -0.7, rad * 0.5);
      noStroke();
      fill(antherColor);
      ellipse(rad * -0.7, rad * 0.5, rad * 0.5, rad);

      pop();
    }

    // 아주 낮은 확률로 먹이가 무작위로 생성됩니다
    if (random(1) < 0.3) {
      const pos = createVector(random(width), random(height));
      this.foodPositions.push(pos);
      this.r.push(0.5);
      this.colors.push(random([
        color('#d1b7ccff'),
        color('#d9cbc0ff'),
        color('#c0bbd0ff')
      ]));
    }

    // 성장 처리
    for (let i = 0; i < this.r.length; i++) {
      if (random(1) < 0.02 && this.r[i] < this.maxR) {
        this.r[i] += 0.08;
      }
    }
  }
}


// 둥근 모서리 사변형 (각 코너 반경 지정)
function roundedQuad(x1, y1, x2, y2, x3, y3, x4, y4, r1 = 0, r2 = 0, r3 = 0, r4 = 0) {
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 2; // 고정값

  // path
  ctx.moveTo(x1, y1);
  ctx.arcTo(x2, y2, x3, y3, r2);
  ctx.arcTo(x3, y3, x4, y4, r3);
  ctx.arcTo(x4, y4, x1, y1, r4);
  ctx.arcTo(x1, y1, x2, y2, r1);
  ctx.closePath();

  // ✅ p5 상태를 존중: _doFill / _doStroke 확인 후 호출
  const r = _renderer || (window?._renderer); // p5 내부 렌더러
  if (!r) {            // 혹시 몰라서 fallback
    ctx.fill();
    ctx.stroke();
  } else {
    if (r._doFill) ctx.fill();          // fill() / noFill() 반영
    if (r._doStroke) {
      ctx.lineWidth = strokeWeight();     // p5의 굵기 사용
      ctx.stroke();                       // stroke() / noStroke() 반영
    }
  }

  ctx.restore();
}