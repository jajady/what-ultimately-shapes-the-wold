// ===================== World =====================
class World {
  // 생명체 개체군과 먹이를 관리
  constructor(populationSize) {
    this.creatures = [];
    this.creatutreCount = 2;

    for (let i = 0; i < populationSize; i++) {
      const creatureCount = 2;                 // 생명체 종류 개수
      const pick = floor(random(creatureCount)) + 1;

      const position = createVector(random(width), random(height));

      const dna = new DNA();

      if (pick === 1) this.creatures.push(new Caterpillar(position, dna));
      else this.creatures.push(new Octo(position, dna));
    }

    // 먹이
    this.food = new Food(populationSize);

    // --- ★ Boid 무리 생성 ---
    this.flock = new Flock();
    const boidCount = 400; // boid 개수

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

  run() {
    // 먹이 업데이트/스폰
    this.food.run();

    // ── stage 4 진입 시 리더 지정 (딱 1회)
    if (stage === 4 && !this._leadersAssignedAtStage4) {
      // r 기준으로 한 번 정렬해두고 이 배열을 기반으로 필터링
      const byR = [...this.creatures].sort((a, b) => (b.r || 0) - (a.r || 0));

      console.log('=== stage4 leader candidates (by r) ===');
      byR.slice(0, 5).forEach((c, idx) => {
        console.log(
          idx,
          'r=',
          c.r,
          'level=',
          c.level,
          'evo=',
          c.evolutionStep,
          'isHalo=',
          c.isHalo
        );
      });

      const leaders = [];

      // 1️⃣ 후광(isHalo) 있는 개체들 중에서 r 큰 순
      const haloCandidates = byR.filter(c => c.isHalo);
      leaders.push(...haloCandidates.slice(0, 3));

      // 2️⃣ 아직 3명 안 되면, evolutionStep >= 2 중에서 r 큰 순
      if (leaders.length < 3) {
        const evoCandidates = byR.filter(
          c => c.evolutionStep >= 2 && !leaders.includes(c)
        );
        leaders.push(...evoCandidates.slice(0, 3 - leaders.length));
      }

      // 3️⃣ 그래도 모자라면, 나머지 전체 중 r 큰 순
      if (leaders.length < 3) {
        const fallback = byR.filter(c => !leaders.includes(c));
        leaders.push(...fallback.slice(0, 3 - leaders.length));
      }

      // 큰/중/작 센터 (radius 큰 순)
      const centersBySize = Array.isArray(flowfield?.centers)
        ? [...flowfield.centers].sort(
          (a, b) => (b.radius || 0) - (a.radius || 0)
        )
        : [];

      leaders.forEach((c, i) => {
        if (!c) return;
        c.isLeader = true;
        c.leaderSince = millis();
        // ➤ 추가: 리더가 되면 반지름 r을 2배로
        c.r = c.r * 2;

        const home =
          centersBySize[i] || centersBySize[centersBySize.length - 1];
        if (home) {
          c.anchorTo(home, i + 1); // rank: 1,2,3
        }
      });

      this._leadersAssignedAtStage4 = true;
    }

    // ⬇️ 나머지 run() 코드는 그대로
    // 생명체 업데이트 (역순 순회: 죽은 개체 제거 안전)
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i];
      c.run();
      c.eat(this.food);
      // ✅ stage 4에서는 체력 나눠주기 로직 호출 안 함
      if (typeof stage === 'undefined' || stage !== 4) {
        c.updateHaloHeal(this.creatures);
      }

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
    if (stage === 1 && touchedCnt >= 23) {
      goStage(2);
      return;
    }

    // 2 -> 3 : isColored 개체 15+
    if (stage === 2 && coloredCnt >= 80) {
      goStage(3);
      return;
    }

    // ★ 현재가 stage 3인데, 처음 들어온 프레임이라 타임스탬프가 없다면 기록
    if (stage === 3 && this._stage3EnteredMs == null) {
      this._stage3EnteredMs = millis();
    }

    // 3 -> 4 : isHalo 개체 10+
    if (stage === 3 && haloCnt >= 40) {
      goStage(4);
      return;
    }

    // ★ 보조 규칙: stage3가 된 뒤 15초가 지났는데 아직 4가 아니면 강제 4로
    if (stage === 3 && this._stage3EnteredMs != null) {
      const elapsed = millis() - this._stage3EnteredMs;
      if (elapsed >= 60000 * 4) {    // 4분
        goStage(4);
        return;
      }
    }
  }
}