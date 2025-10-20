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
      else this.creatures.push(new Headset(position, dna));
    }

    // 먹이
    this.food = new Food(populationSize * 0.75);

    // stage4 진입 1회성 리더 지정 플래그
    this._leadersAssignedAtStage4 = false;
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

        // 콘솔 확인용
        // console.log(`[LEADER] rank=${c.leaderRank}, level=${c.level || 0}, kind=${c.kind || 'Creature'}`);
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

    // 조건 충족 시 자동 스테이지 전환
    this._autoAdvanceStage();
  }

  // ─────────────────────────────
  // 자동 스테이지 전환
  // 1→2 : 3초 연속 접촉 달성(everTouched3s) 개체 ≥ 10
  // 2→3 : isColored 개체 ≥ 10
  // 3→4 : isHalo   개체 ≥ 10
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
      if (typeof ensureAudio === 'function') ensureAudio();
      if (typeof playStageMusic === 'function') playStageMusic(stage);
      console.log('stage →', stage);
    };

    // 1 -> 2 : 3초 연속 접촉 달성 개체 20+
    if (stage === 1 && touchedCnt >= 20) {
      goStage(2);
      return;
    }
    // 2 -> 3 : isColored 개체 15+
    if (stage === 2 && coloredCnt >= 15) {
      goStage(3);
      return;
    }
    // 3 -> 4 : isHalo 개체 10+
    if (stage === 3 && haloCnt >= 10) {
      goStage(4);
      return;
    }
  }
}