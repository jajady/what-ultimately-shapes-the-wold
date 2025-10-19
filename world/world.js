
// 진화 생태계

// World
// 생명체와 먹이가 있습니다

class World {
  //{!2} World 클래스는
  // 생명체 개체군과 모든 먹이를 관리합니다
  constructor(populationSize) {
    this.creatures = [];      // 개체군 생성
    this.creatutreCount = 2;

    for (let i = 0; i < populationSize; i++) {
      const creatureCount = 2;      // 생명체 종류 개수
      const pick = floor(random(creatureCount)) + 1   // 생명체 종류 중 하나를 뽑음
      // console.log(pick);               
      let position = createVector(random(margin, width - margin), random(margin, height - margin)); // 랜덤한 위치에 생성
      let dna = new DNA();
      // this.creatures.push(new Creature(position, dna));
      if (pick === 1) {
        this.creatures.push(new Caterpillar2(position, dna));
      } else {
        this.creatures.push(new Headset(position, dna));
      }

      // if (p < 0.5) this.creatures.push(new Creature(position, dna));
      // else this.creatures.push(new Caterpillar(position, dna));

    }
    // 먹이 생성
    this.food = new Food(populationSize * 0.75);

    // ── 추가: stage4에서 리더 선정 플래그
    this._leadersAssignedAtStage4 = false;
  }

  // 세상 실행
  run() {
    this.food.run();    // 먹이 그리기 & 새로운 먹이 추가

    // ── stage 4 진입 시 “레벨 TOP3” 리더 지정 (딱 1회)
    if (stage === 4 && !this._leadersAssignedAtStage4) {
      // 레벨 높은 순으로 정렬
      const top = [...this.creatures].sort((a, b) => (b.level || 0) - (a.level || 0)).slice(0, 3);

      // 큰/중/작 센터 (radius 큰 순)
      const centersBySize = [...flowfield.centers].sort((a, b) => (b.radius || 0) - (a.radius || 0));

      top.forEach((c, i) => {
        if (!c) return;
        c.isLeader = true;
        c.leaderSince = millis();
        c.leaderRank = i + 1;
        // (선택) 홈 좌표 저장만 — 실제 이동은 stage4에서 모두 “흐름장”으로만!
        const home = centersBySize[i] || centersBySize[centersBySize.length - 1];
        c.home = createVector(home.x, home.y);

        // 콘솔 로그
        console.log(`[LEADER] rank=${c.leaderRank}, level=${c.level || 0}, kind=${c.kind || 'Creature'}`);
      });

      this._leadersAssignedAtStage4 = true;
    }

    // 생명체 관리 (생명체가 삭제되므로 배열을 역순으로 순회합니다.)
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      let creature = this.creatures[i];
      creature.run();                   // 모든 생명체는 실행되고 먹이를 먹습니다
      creature.eat(this.food);
      creature.updateHaloHeal(this.creatures);
      if (creature.dead()) {               // 만약 죽었다면, 제거하고 먹이를 생성합니다
        this.creatures.splice(i, 1);
        this.food.add(creature.position);
      } else {
        //{!2} 여기에서 살아있는 각 생명체가 번식할 기회를 갖습니다.
        // 번식에 성공하면, 개체군에 추가됩니다.
        // 번식하지 않으면 "child"의 값은 undefined입니다.
        let child = creature.reproduce();
        if (child) {
          this.creatures.push(child);
        }
      }
    }

    // console.log(this.creatures.length);   // 현재 개체수
  }

  // 리더 배정 
  _assignLeaders() {
    // 1) 리더 후보: isLeader === true
    const leaders = this.creatures.filter(c => c.isLeader && !c.dead());

    // 2) 오래된 리더 순(leaderSince 오름차순)
    leaders.sort((a, b) => (a.leaderSince || 0) - (b.leaderSince || 0));

    // 3) 상위 3명만 "정박 리더"로 지정, 나머지는 정박 해제
    const top3 = leaders.slice(0, 3);
    const others = leaders.slice(3);

    // 4) 흐름장 중심을 "큰 소용돌이 → 작은 소용돌이"로 정렬
    let centersSorted = [];
    if (typeof flowfield !== 'undefined' && Array.isArray(flowfield.centers)) {
      centersSorted = [...flowfield.centers].sort((a, b) => {
        const ra = a.radius ?? 0, rb = b.radius ?? 0;
        if (rb !== ra) return rb - ra;
        const sa = a.strength ?? 0, sb = b.strength ?? 0;
        return sb - sa;
      });
    }

    // 5) 상위 3명에게 중심 배정 (없으면 건너뜀)
    for (let i = 0; i < top3.length; i++) {
      const c = top3[i];
      const center = centersSorted[i];
      if (center) {
        if (c.anchorRank !== (i + 1) || !c.home || dist(c.home.x, c.home.y, center.x, center.y) > 1) {
          c.anchorTo(center, i + 1);
        }
      } else {
        // 중심이 부족하면 정박만 표시
        if (c.anchorRank !== (i + 1)) c.anchorRank = (i + 1);
      }
    }

    // 6) 나머지 리더들은 정박 해제(여전히 isLeader는 유지)
    for (const c of others) {
      if (c.anchorRank !== 0) c.unanchor();
    }

    // 7) Stage 전환: 정박 리더(=top3)가 3명 이상이면 Stage4
    if (top3.length >= 3) {
      stage = 4;
    }
  }
}