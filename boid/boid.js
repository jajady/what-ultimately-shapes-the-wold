// ★ 이 프로젝트용 boid (Creature를 상속하지 않음)
class Boid {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();     // 아무 방향으로 시작
    this.acceleration = createVector(0, 0);

    this.r = 4;           // boid 반지름 (시각용)
    this.maxspeed = 0.5;  // 최대 속도
    this.maxforce = 0.04; // 최대 조향력
  }

  // 매 프레임 호출
  run(boids, foodManager) {
    this.flock(boids);                // 다른 boid들과 상호작용 (Separation/Align/Cohesion)
    const huntForce = this.hunt(foodManager); // 먹이 추적 힘
    huntForce.mult(1.2);              // 먹이 향해 가고 싶어하는 정도 (튜닝 가능)

    this.applyForce(huntForce);

    this.update();
    this.borders();
    this.eat(foodManager);            // 먹이와 충돌하면 줄이기
    this.show();
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0); // 다음 프레임을 위해 초기화
  }

  // 화면 래핑 (Creature.borders랑 비슷하지만 독립)
  borders() {
    const m = 0;
    const rr = this.r * 2;
    if (this.position.x < m - rr) this.position.x = width - m + rr;
    if (this.position.y < m - rr) this.position.y = height - m + rr;
    if (this.position.x > width - m + rr) this.position.x = m - rr;
    if (this.position.y > height - m + rr) this.position.y = m - rr;
  }

  // ------------------- Flocking 규칙 -------------------
  flock(boids) {
    const sep = this.separate(boids).mult(1.5);
    const ali = this.align(boids).mult(1.0);
    const coh = this.cohere(boids).mult(1.0);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  // Separation: 너무 가까워지지 않기
  separate(boids) {
    const desiredSeparation = 20;
    const steer = createVector(0, 0);
    let count = 0;

    for (const other of boids) {
      const d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < desiredSeparation) {
        const diff = p5.Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d);      // 더 가까울수록 더 강하게
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) steer.div(count);

    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // Alignment: 주변 boid들과 방향/속도 맞추기
  align(boids) {
    const neighborDistance = 50;
    const sum = createVector(0, 0);
    let count = 0;

    for (const other of boids) {
      const d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < neighborDistance) {
        sum.add(other.velocity);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxspeed);
      const steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxforce);
      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  // Cohesion: 주변 boid들의 중심 쪽으로
  cohere(boids) {
    const neighborDistance = 50;
    const sum = createVector(0, 0);
    let count = 0;

    for (const other of boids) {
      const d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < neighborDistance) {
        sum.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);          // 중심 = 평균 위치
      return this.seek(sum);   // 그쪽으로 이동하려는 steering
    } else {
      return createVector(0, 0);
    }
  }

  // ------------------- 먹이 탐색 + 추적 -------------------
  // Food 클래스를 그대로 사용: foodManager.foodPositions / foodManager.r 참조
  hunt(foodManager) {
    if (!foodManager) return createVector(0, 0);

    const positions = foodManager.foodPositions;
    const radii = foodManager.r;

    const visionRange = 250;           // 최대 감지 거리
    const fovHalfAngle = radians(60);  // 시야 반각 (총 120도)
    let closestIdx = -1;
    let closestDist = Infinity;

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const toFood = p5.Vector.sub(pos, this.position);
      const d = toFood.mag();
      if (d === 0 || d > visionRange) continue;

      // 내 진행 방향 vs 먹이 방향
      const angle = p5.Vector.angleBetween(this.velocity, toFood);
      if (angle > fovHalfAngle) continue; // 시야 밖이면 무시

      if (d < closestDist) {
        closestDist = d;
        closestIdx = i;
      }
    }

    if (closestIdx >= 0) {
      return this.seek(positions[closestIdx]);
    } else {
      return createVector(0, 0);
    }
  }

  // ------------------- 먹이 먹기 -------------------
  eat(foodManager) {
    if (!foodManager) return;
    const positions = foodManager.foodPositions;
    const radii = foodManager.r;
    const colors = foodManager.colors;

    // 뒤에서부터 돌면서 먹이 크기 줄이고, 너무 작으면 삭제
    for (let i = positions.length - 1; i >= 0; i--) {
      const pos = positions[i];
      const d = p5.Vector.dist(this.position, pos);
      const sumR = this.r + radii[i];

      if (d < sumR) {
        // boid가 한 번 "베어먹을" 때 줄어드는 양
        radii[i] -= 0.05;
        if (radii[i] <= 0.2) {
          positions.splice(i, 1);
          radii.splice(i, 1);
          colors.splice(i, 1);
        }
      }
    }
  }

  // ------------------- 유틸 -------------------
  // target을 향해 가는 steering force
  seek(target) {
    const desired = p5.Vector.sub(target, this.position);
    desired.normalize();
    desired.mult(this.maxspeed);

    const steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  }

  show() {
    const angle = this.velocity.heading();

    push();
    translate(this.position.x, this.position.y);
    rotate(angle);
    fill(180, 220);
    noStroke();
    beginShape();
    vertex(this.r * 1, 0);       // 기존 this.r * 2 → 절반
    vertex(-this.r * 1, -this.r * 0.5); // 기존 -this.r * 2 → 절반
    vertex(-this.r * 1, this.r * 0.5);  // 절반
    endShape(CLOSE);
    pop();
  }
}



