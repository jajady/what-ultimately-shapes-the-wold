// ===================== World =====================
class World {
  // 생명체 개체군과 먹이를 관리
  constructor(populationSize) {
    this.creatures = [];
    this.creatutreCount = 2;

    for (let i = 0; i < populationSize; i++) {
      const creatureCount = 2;                 // 생명체 종류 개수
      const pick = floor(random(creatureCount)) + 1;

      // 중심 원 내부에서 균일 분포로 스폰
      const position = randomPosInCenterDisk({
        radius: Math.min(width, height) / 2 - margin,
      });

      const dna = new DNA();

      if (pick === 1) this.creatures.push(new Caterpillar2(position, dna));
      else this.creatures.push(new Octo(position, dna));
    }

    // 먹이
    this.food = new Food(populationSize * 0.75);

    // --- ★ Boid 무리 생성 ---
    this.flock = new Flock();
    const boidCount = 80; // boid 개수

    // 중심 좌표 계산
    const centerX = width / 2;
    const centerY = height / 2;

    // 중심 근처 (반경 100px 정도의 원 안)
    const spawnRadius = 100;

    for (let i = 0; i < boidCount; i++) {
      const angle = random(TWO_PI);     // 0~360도 방향
      const r = random(spawnRadius);    // 반경 0~100px
      const x = centerX + cos(angle) * r;
      const y = centerY + sin(angle) * r;

      this.flock.addBoid(new Boid(x, y));
    }


    // stage4 진입 1회성 리더 지정 플래그
    this._leadersAssignedAtStage4 = false;

    // ★ stage3 진입 시각(강제 넘어감 타이머용)
    this._stage3EnteredMs = null;
  }

  // 매 프레임 실행
  run() {
    // 먹이 업데이트/스폰
    this.food.run();

    // ── stage 4 진입 시 “레벨 TOP3” 리더 지정 (딱 1회)
    if (stage === 4 && !this._leadersAssignedAtStage4) {
      const top = [...this.creatures]
        .sort((a, b) => (b.level || 0) - (a.level || 0))
        .slice(0, 3);

      // 큰/중/작 센터 (radius 큰 순)
      const centersBySize = Array.isArray(flowfield?.centers)
        ? [...flowfield.centers].sort((a, b) => (b.radius || 0) - (a.radius || 0))
        : [];

      top.forEach((c, i) => {
        if (!c) return;
        c.isLeader = true;
        c.leaderSince = millis();
        c.leaderRank = i + 1;

        const home = centersBySize[i] || centersBySize[centersBySize.length - 1];
        if (home) c.home = createVector(home.x, home.y);
      });

      this._leadersAssignedAtStage4 = true;
    }

    // 생명체 업데이트 (역순 순회: 죽은 개체 제거 안전)
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i];
      c.run();
      c.eat(this.food);
      c.updateHaloHeal(this.creatures);

      if (c.dead()) {
        this.creatures.splice(i, 1);
        this.food.add(c.position);
      } else {
        const child = c.reproduce();
        if (child) this.creatures.push(child);
      }
    }

    // --- ★ Boid 무리 업데이트 + 먹이 추적/섭취 ---
    if (this.flock) {
      this.flock.run(this.food);
    }

    // 조건 충족 시 자동 스테이지 전환
    this._autoAdvanceStage();
  }

  // ─────────────────────────────
  // 자동 스테이지 전환
  // 1→2 : 3초 연속 접촉 달성(everTouched3s) 개체 ≥ 20
  // 2→3 : isColored 개체 ≥ 15
  // 3→4 : isHalo   개체 ≥ 10
  // + 보조 : stage3가 된 뒤 15초 지났는데도 아직 stage4가 아니면 강제 4로
  // ─────────────────────────────
  _autoAdvanceStage() {
    const total = this.creatures.length;
    if (total === 0) return;

    let touchedCnt = 0, coloredCnt = 0, haloCnt = 0;

    for (const c of this.creatures) {
      if (c.dead && c.dead()) continue;
      if (c.everTouched3s) touchedCnt++;
      if (c.isColored) coloredCnt++;
      if (c.isHalo) haloCnt++;
    }

    const goStage = (next) => {
      if (stage === next) return;
      stage = next;

      // ★ stage3 타임스탬프 기록/리셋
      if (stage === 3) {
        this._stage3EnteredMs = millis();
      } else if (stage !== 3) {
        this._stage3EnteredMs = null;
      }

      if (typeof ensureAudio === 'function') ensureAudio();
      if (typeof playStageMusic === 'function') playStageMusic(stage);
      console.log('stage →', stage);
    };

    // 1 -> 2 : 3초 연속 접촉 달성 개체 20+
    if (stage === 1 && touchedCnt >= 30) {
      goStage(2);
      return;
    }

    // 2 -> 3 : isColored 개체 15+
    if (stage === 2 && coloredCnt >= 40) {
      goStage(3);
      return;
    }

    // ★ 현재가 stage 3인데, 처음 들어온 프레임이라 타임스탬프가 없다면 기록
    if (stage === 3 && this._stage3EnteredMs == null) {
      this._stage3EnteredMs = millis();
    }

    // 3 -> 4 : isHalo 개체 10+
    if (stage === 3 && haloCnt >= 20) {
      goStage(4);
      return;
    }

    // ★ 보조 규칙: stage3가 된 뒤 15초가 지났는데 아직 4가 아니면 강제 4로
    if (stage === 3 && this._stage3EnteredMs != null) {
      const elapsed = millis() - this._stage3EnteredMs;
      if (elapsed >= 150000) {    // 잠시 수정
        goStage(4);
        return;
      }
    }
  }
}