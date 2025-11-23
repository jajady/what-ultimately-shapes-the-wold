// 포식자 -> 더 빠른 생명체가 많이 살아남아 점점 더 빠른 생명체로 진화하게 된다.
// 먹이 -> 점점 먹이를 잘 찾고 먹는 생명체로 진화.
// 부모 선택을 위한 "적합도": 오래 살수록 번식할 기회가 많아짐 => 수명.

/* 
  Creature (모든 생명체의 부모 클래스)
*/

class Creature {
  constructor(position, dna) {
    this.position = position; // Location
    this.velocity = createVector(0, 0);   // 속도

    this.xoff = random(1000); // For perlin noise
    this.yoff = random(1000);

    this.dna = dna; // DNA
    this.initHealth = map(this.dna.genes[0], 0, 1, 150, 550);    // 생명 초기값
    this.health = 0;      // 생명 타이머 (수명)

    this.maxspeed = map(this.dna.genes[0], 0, 1, 1, 0.1);     // 사이즈가 클수록 느려지도록 3~1
    this.initMaxSpeed = this.maxspeed;        // 처음 배정된 최대속도 저장
    this.r = map(this.dna.genes[0], 0, 1, 1, 10);    // 사이즈가 클수록 느려지도록
    this.baseR = this.r;
    this.levelRadiusStep = 0.1;   // level 1당 +8% (원하는 만큼 조절)
    this.isBorder = false;        // 경계 관리

    // 스폰(등장) 상태
    this.isSpawning = true;
    this.spawnStartMs = millis();
    this.spawnDurationMs = 3000;     // 3초 페이드인
    this.spawnScale = 0.6;           // 등장 초기에 약간 작게(선택사항)

    const pal = this.dna?.genes?.[1] || {};       //   색
    this.baseC1 = color('#ffffff');                  // 기준색 1
    this.baseC2 = color(pal.c2 || '#ffffff');        // 기준색 2
    this.baseC3 = color(pal.c3 || '#ffffff');        // 기준색 3
    this.baseC4 = color(pal.c4 || '#ffffff');        // 기준색 4
    this.black = color('#000000');
    this.white = color('#ffffff');
    // 화면에 쓸 가변색(초기값은 기준색과 동일)
    this.currentColor = this.baseC1;
    this.c2 = this.baseC2;
    this.c3 = this.baseC3;
    this.c4 = this.baseC4;
    this.bl = this.black;
    this.wh = this.white;
    this.isColored = false;         // 색이 변했는지
    this.touchedFood = false;       // 먹이와 닿았는지

    this.evolutionStep = this.dna.genes[2];     // 진화 단계 1으로 시작.
    this.maxEvolutionStep = 5;
    // ▼ 생성 직후, DNA의 단계에 맞게 '외형/색' 초기화
    if (this.evolutionStep >= 2 && !this.isColored) {
      const baseCol = this.dna?.genes?.[1]?.c1 || '#ffffff';
      this.baseC1 = color(baseCol);
      this.isColored = true;
    }
    this._needsInitialEvolve = true; // ← 첫 프레임에 한 번만 적용 플래그

    // 연속 접촉 시간
    // (기존: wasHandInside / strokeCount 기반 ‘쓰다듬기’ → 변경: 연속 접촉 시간 기반)
    this.touching = false;               // 지금 손에 닿아 있는지
    this.touchHoldMs = 0;                // 연속 접촉 누적 시간(ms)
    this.everTouched3s = false;          // 한 번이라도 3초 연속 접촉(쓰다듬기) 달성?
    this.touchThresholdMs = 3000;        // 임계치: 3초
    this.touchTriggered = false;         // (이제 사용 안 해도 되지만 남겨둬도 무방)
    this._lastUpdateMs = millis();       // 프레임 간 경과시간 계산용

    this.buffActive = false;     // 3초 버프 on/off
    this.buffEndMs = 0;          // 버프 종료 시각 (millis)
    this.buffScaleBase = 1.0;           // 평상시 스케일
    this.buffScalePeak = 1.5;           // 버프 시 목표 스케일(원래 buffScale 값)
    this.buffScaleNow = 1.0;           // 현재 표시용 스케일(애니메이션 결과)
    // 애니메이션 내부 상태
    this._buffAnimStart = 0;            // 애니메이션 시작 시간(ms)
    this._buffAnimDur = 350;          // 올라가거나 내려가는 데 걸리는 시간(ms)
    this._buffAnimating = false;        // 지금 보간 중인가?
    this._buffFrom = 1.0;          // 시작 값
    this._buffTo = 1.0;          // 목표 값

    // ▼ 진화 쿨다운(5초) 관련 추가
    this.evoCooldownMs = 5000;      // 진화 후 5초간 막힘
    this._evoCooling = false;       // 쿨다운 중인가?
    this._evoCooldownEnd = 0;       // 쿨다운 해제 시각(ms)

    this.isHalo = false;          // 후광 능력 보유 여부
    this.healRange = 150;         // 탐색 반경
    this.healDurationMs = 2000;   // 한 세션 길이(2초)
    this.healMaxPerSession = 150; // 한 세션에 최대 나눠주는 총 체력
    this.healMinDonorKeep = this.initHealth * 0.3; // 기부자가 최소로 유지할 체력

    // 내부 상태
    this._healTarget = null;      // 현재 힐 대상
    this._healStartMs = 0;        // 시작 시각
    this._healEndMs = 0;          // 종료 시각
    this._healLastMs = millis();  // 전 프레임 시간 (적분용)

    // “수혜자 입장”에서 중복 힐 방지 플래그(다른 기부자가 동시에 주입 못하게)
    this._healingFrom = null;     // 누가 나에게 주고 있나?
    this._lastHealTarget = null;
    this._lastHealEndMs = 0;
    this.healCooldownMsPerTarget = 3000;   // 예: 같은 애는 3초 동안 다시 힐하지 않기

    // ==== 레벨(후광 + stage3에서만 10초마다 +1) ====
    this.level = 0;
    this._lastLevelUpMs = null;        // 조건 만족 시 시작할 타이머
    this.isLeader = false;             // 레벨4 이상이면 true
    this.leaderSince = 0;              // 리더로 승격된 시각(우선순위용)

    // "정박 리더" (상위 3명) 전용 상태
    this.anchorRank = 0;               // 0=비정박, 1/2/3=우선순위 정박 리더
    this.home = null;                  // 배정된 중심점 p5.Vector
    this.homeStartPos = null;
    this.homeStartMs = 0;
    this.homeDurationMs = 30000;       // 10초 귀소
    this.arriveRadius = 14;
    this.arrived = false;
    this.spinAngle = 0;
    this.spinSpeed = 0.2;             // 도착 후 자전 속도
  }

  run() {
    // ✅ 첫 프레임에 한 번만 onEvolve 호출 (서브클래스가 자기 필드를 모두 세팅한 뒤)
    if (this._needsInitialEvolve) {
      this._needsInitialEvolve = false;
      if (typeof this.onEvolve === 'function') {
        this.onEvolve(this.evolutionStep);
      }
    }
    this.update();
    this.borders();
    this.calCurrentColor();
    this.checkPetting();    // ‘연속 접촉 시간’ 판정으로 동작)
    this.updateBuff();
    this.show();
    this.tickLevel();
  }

  // 후광 보유 시 시간에 따라 레벨 상승 (초당 0.06 → 약 67초에 레벨4 도달)
  // stage===3 이고 isHalo===true 인 동안에만, 10초마다 level += 1
  tickLevel() {
    const inStage3WithHalo = (typeof stage !== 'undefined' && stage === 3 && this.isHalo);
    const now = millis();

    // 조건 막 만족하면 타이머 시작
    if (inStage3WithHalo && this._lastLevelUpMs == null) {
      this._lastLevelUpMs = now;
      return;
    }
    // 조건 미충족이면 증가 정지(타이머 유지)
    if (!inStage3WithHalo || this._lastLevelUpMs == null) return;

    // 10초 경과마다 +1 (여러 구간 한꺼번에 보정)
    while (now - this._lastLevelUpMs >= 10000) {
      this.level += 1;
      this._lastLevelUpMs += 10000;
      // console.log(`[LEVEL UP] ${this.kind||'Creature'} → L${this.level}`);

      // 🔥 level에 따라 반지름도 조금씩 커지게 (단, stage 4 미만에서만)
      if (typeof stage === 'undefined' || stage < 4) {
        const maxVisualLevel = 10;                     // 너무 커지지 않게 상한
        const L = constrain(this.level, 0, maxVisualLevel);
        const scaleFromLevel = 1 + L * this.levelRadiusStep;  // 1, 1.05, 1.10, ...

        this.r = this.baseR * scaleFromLevel;
      }
      // stage >= 4인 경우에는 level은 올라가도 r은 더 이상 커지지 않고,
      // stage 3에서 마지막으로 계산된 크기를 그대로 유지함.
    }
  }

  // 정박 리더로 지정(1~3순위)
  anchorTo(center, rank) {
    this.anchorRank = rank;          // 1,2,3
    this.home = createVector(center.x, center.y);
    this.homeStartPos = this.position.copy();
    this.homeStartMs = millis();
    this.arrived = false;
  }

  // 정박 해제(여전히 리더일 순 있으나 중심 배정 X)
  unanchor() {
    this.anchorRank = 0;
    this.home = null;
    this.arrived = false;
  }

  // ★ 현재 표시용 스케일
  getVisualScale() {
    // 스폰 중 크기 변화(this.spawnScale)와 버프 스케일(this.buffScaleNow)을 곱해 합성
    return (this.spawnScale ?? 1.0) * this.buffScaleNow;
  }

  // ★ 기본 깜빡임 메서드 (서브클래스에서 필요시 override)
  blink(isTouching) {
    if (this.eyeOpen === undefined) this.eyeOpen = 1.0;
    if (this._blinkPhase === undefined) this._blinkPhase = 0;
    if (this._blinkSpeed === undefined) this._blinkSpeed = 0.25; // 기본 속도

    if (isTouching) {
      this._blinkPhase += this._blinkSpeed;
      this.eyeOpen = (1 + Math.cos(this._blinkPhase)) * 0.5; // 1..0..1
      if (this._blinkPhase >= TWO_PI) this._blinkPhase -= TWO_PI;
    } else {
      this.eyeOpen = lerp(this.eyeOpen, 1, 0.25); // 자연 복귀
    }
  }

  // ★ 손이 ‘연속 접촉 시간(3초)’ 카운트.
  checkPetting() {
    if (this.isSpawning) return;      // 등장 중엔 못 쓰다듬게

    const now = millis();
    const dt = now - this._lastUpdateMs;
    this._lastUpdateMs = now;

    // ── 진화 쿨다운 해제 체크 ─────────────────────
    if (this._evoCooling && now >= this._evoCooldownEnd) {
      this._evoCooling = false;
    }

    // 손 반경
    const handR = (typeof rHand === 'number' ? rHand * 0.5 : 25);

    // 월드 좌표계 손 포인트 배열 사용
    let insideAny = false;

    if (Array.isArray(handPointsWorld) && handPointsWorld.length > 0) {
      for (const hp of handPointsWorld) {
        const d = dist(this.position.x, this.position.y, hp.x, hp.y);
        if (d < (this.r + handR)) { insideAny = true; break; }
      }
    } else if (typeof handPosition !== 'undefined' && handPosition) {
      const d = dist(this.position.x, this.position.y, handPosition.x, handPosition.y);
      insideAny = (d < this.r + handR);
    } else {
      insideAny = false;
    }

    this.touching = insideAny;

    // 각 생명체 개별 blink 로직
    if (typeof this.blink === 'function') {
      this.blink(this.touching);
    }

    if (this.touching) {
      // 연속 접촉 시간 누적
      this.touchHoldMs += dt;

      // 3초 이상 연속으로 닿았을 때
      if (this.touchHoldMs >= this.touchThresholdMs) {
        // 버프(커짐) 발동
        this.activateBuff(3000);
        this.everTouched3s = true;

        // ─────────────────────────────────────
        // 1) 진화: stage 2, 3 모두에서 가능
        // ─────────────────────────────────────
        const canEvolveStage =
          (typeof stage !== 'undefined') &&
          (stage === 2 || stage === 3);

        if (canEvolveStage && !this._evoCooling) {
          const prevStep = this.evolutionStep;
          const nextStep = min(this.evolutionStep + 1, this.maxEvolutionStep);

          if (nextStep !== prevStep) {
            this.evolutionStep = nextStep;

            // 1 → 2로 넘어갈 때 최초 색 입히기
            if (prevStep === 1 && !this.isColored) {
              const baseCol = this.dna?.genes?.[1]?.c1
                || this.dna?.genes?.[1]
                || this.baseC1;
              this._setColored(baseCol);
            }

            // DNA에도 단계 저장
            if (this.dna?.genes) this.dna.genes[2] = this.evolutionStep;

            // 서브클래스 훅 호출 (더듬이/털/줄무늬/발 등)
            if (typeof this.onEvolve === 'function') {
              this.onEvolve(this.evolutionStep);
            }
          }
        }

        // ─────────────────────────────────────
        // 2) 후광: stage 3 + 진화 단계 3단계 이상
        // ─────────────────────────────────────
        const fullyEvolved = (this.evolutionStep >= 3);

        if (typeof stage !== 'undefined' && stage === 3 && fullyEvolved) {
          const was = this.isHalo;
          this.isHalo = true;
          if (!was && this._lastLevelUpMs == null) {
            this._lastLevelUpMs = millis(); // 레벨업 타이머 시작
          }
        }

        // ─────────────────────────────────────
        // 3) 진화 쿨다운 시작 (5초간 추가 진화 봉인)
        // ─────────────────────────────────────
        this._evoCooling = true;
        this._evoCooldownEnd = now + this.evoCooldownMs;

        // 다음 3초를 새로 세기 위해 리셋
        this.touchHoldMs = 0;
      }
    } else {
      // 손이 떨어지면 카운트 리셋
      this.touchHoldMs = 0;
    }
  }

  onEvolve() {
    // 오버라이딩
  }

  // ★ 버프 켜기
  activateBuff(durationMs) {
    const now = millis();

    this.buffActive = true;
    this.buffEndMs = now + durationMs;

    // ✔ 올라가는 애니메이션(현재값 → peak)
    this._buffAnimStart = now;
    this._buffFrom = this.buffScaleNow;   // 지금 크기에서
    this._buffTo = this.buffScalePeak;  // 목표 크기로
    this._buffAnimating = true;
  }

  // ★ 버프 종료 체크
  updateBuff() {
    const now = millis();

    // 1) 애니메이션 한 프레임 진행 (있다면)
    if (this._buffAnimating) {
      const tRaw = (now - this._buffAnimStart) / this._buffAnimDur;
      const u = constrain(tRaw, 0, 1);          // 0~1
      const ease = (x) => x * x * (3 - 2 * x);  // smoothstep(부드러운 S-curve)
      this.buffScaleNow = lerp(this._buffFrom, this._buffTo, ease(u));
      if (u >= 1) this._buffAnimating = false;  // 끝나면 정지
    }

    // 2) 버프 지속 시간 끝나면 "부드럽게 내려가기" 시작
    if (this.buffActive && now > this.buffEndMs) {
      this.buffActive = false;

      // ✔ 내려가는 애니메이션(현재값 → base)
      this._buffAnimStart = now;
      this._buffFrom = this.buffScaleNow;    // 지금 크기에서
      this._buffTo = this.buffScaleBase;   // 원래 크기로
      this._buffAnimating = true;
    }
  }

  // ★ 색이 처음 입혀질 때 처리 + 효과음 재생
  _setColored(baseCol) {
    this.baseC1 = color(baseCol);

    // 이미 색이 있는 상태면 사운드 중복 재생 방지
    if (!this.isColored) {
      this.isColored = true;

      // 오디오가 준비돼 있고, 효과음이 로드되어 있다면 재생
      if (typeof evolveSfx !== 'undefined' && evolveSfx) {
        evolveSfx.play();
      }
    }
  }

  // 체력 나눠주기
  updateHaloHeal(all) {
    const now = millis();

    // 0) 스테이지/후광/체력 조건 확인
    const inStage3 = (typeof stage !== 'undefined' && stage === 3);
    // ❗ stage 4 이상이거나, 후광이 없으면
    //    진행 중이던 힐도 즉시 중단하고 바로 return
    if (!this.isHalo || !inStage3) {
      if (this._healTarget) {
        this._endHeal(true); // 강제 종료
      }
      return;
    }


    // donor는 최소 1/3 이상 남아 있어야 함
    const donorFloor = this.initHealth / 3;
    const donorReady = this.health >= donorFloor;
    if (!donorReady) {
      // 이미 주고 있었다면 즉시 중단
      if (this._healTarget) this._endHeal(true);
      return;
    }

    // 1) 힐 진행 중인 경우: 체력 이동
    if (this._healTarget) {
      const tgt = this._healTarget;

      // 대상이 사라졌거나, 죽었거나, 거리가 너무 멀어지면 중단
      if (!all.includes(tgt) || tgt.dead() || this._distTo(tgt) > this.healRange * 1.3) {
        this._endHeal(true); // 강제 종료 (정리)
        return;
      }

      // 시간 적분으로 부드럽게 이송
      const dtMs = now - this._healLastMs;
      this._healLastMs = now;

      const totalMs = this._healEndMs - this._healStartMs;
      const ratePerMs = this.healMaxPerSession / max(1, totalMs); // ms당 이송량

      let amount = ratePerMs * dtMs;

      // 수혜자 필요치(최대 체력까지)와 기부자 남길 최소치 고려
      const tgtNeed = max(0, tgt.initHealth - tgt.health);
      // ▶ 1/3 바닥선과 기존 최소 유지치 중 더 높은 쪽을 바닥으로
      const keepAbove = max(donorFloor, this.healMinDonorKeep);
      const donorAvail = max(0, this.health - keepAbove);

      amount = min(amount, tgtNeed, donorAvail);

      if (amount > 0) {
        this.health -= amount;
        tgt.health += amount;
      }

      // 시간이 끝났거나, 줄 게 없거나, 바닥선 아래로 떨어지면 종료
      if (now >= this._healEndMs || amount <= 0.0001 || this.health < keepAbove) {
        this._endHeal(false);
      }

      return;
    }

    // 2) 힐 미진행: 대상 탐색 (한 번에 한 명만)
    //   - healRange 안에 있는 애들 중에서
    //   - 체력 비율(health / initHealth)이 가장 낮은 애를 우선
    let best = null;
    let bestHealthRatio = Infinity;  // 낮을수록 "더 아픈" 상태
    let bestDist = Infinity;

    for (const o of all) {
      if (o === this) continue;
      if (o.dead()) continue;
      if (o.isHalo) continue;                           // 후광 보유자는 힐 대상 X
      if (o._healingFrom && o._healingFrom !== this) continue; // 이미 다른 애에게서 받는 중

      const d = this._distTo(o);
      if (d > this.healRange) continue;                 // "가까운 애들"만 후보

      // 현재 체력 비율 (0에 가까울수록 더 아픔)
      const healthRatio = o.health / o.initHealth;

      // ① healthRatio가 더 낮은 애를 우선
      // ② healthRatio가 거의 같다면, 더 가까운 애를 우선
      if (
        healthRatio < bestHealthRatio ||
        (abs(healthRatio - bestHealthRatio) < 0.01 && d < bestDist)
      ) {
        best = o;
        bestHealthRatio = healthRatio;
        bestDist = d;
      }
    }

    // 3) 조건 만족 + 기부자 체력 여유 있으면 시작
    if (best && this.health > this.healMinDonorKeep) {
      this._startHeal(best, now);
    }
  }

  // 거리 유틸
  _distTo(other) {
    return dist(this.position.x, this.position.y, other.position.x, other.position.y);
  }

  // 힐 시작
  _startHeal(target, now) {
    this._healTarget = target;
    this._healStartMs = now;
    this._healEndMs = now + this.healDurationMs;
    this._healLastMs = now;
    target._healingFrom = this; // 수혜자 플래그(동시 주입 방지)
    this._lastHealTarget = target;   // ★ 마지막 타겟 기록
  }

  // 힐 종료(정리)
  _endHeal(forceAbort) {
    if (this._healTarget && this._healTarget._healingFrom === this) {
      this._healTarget._healingFrom = null;
    }
    this._healTarget = null;
    this._healStartMs = 0;
    this._healEndMs = 0;

    this._lastHealEndMs = millis();  // ★ 끝난 시각 기록
  }

  // 후광 보유 시 시간에 따라 레벨 상승 (초당 0.06 → 약 67초에 레벨4 도달)
  // 원하는 속도로 HALO_RATE 조정 가능
  // 정박 리더 이동(20초 귀소 → 도착 후 위치 고정 + 자전)
  _updateAnchoredMotion() {
    if (this.anchorRank === 0 || !this.home) return;

    const now = millis();
    const isStage4Leader =
      this.isLeader &&
      typeof stage !== 'undefined' &&
      stage === 4 &&
      flowfield?.lookup;

    if (!this.arrived) {
      const tRaw = (now - this.homeStartMs) / this.homeDurationMs;
      const t = constrain(tRaw, 0, 1);
      const ease = (u) => u * u * (3 - 2 * u);

      // 20초 동안 homeStartPos → home 으로 진행하는 "이상적인 경로"
      const baseTarget = p5.Vector.lerp(this.homeStartPos, this.home, ease(t));
      let pos = this.position.copy();

      if (isStage4Leader) {
        // 🔄 1) 흐름장 벡터(소용돌이 방향)를 더 강하게 탄다
        const flowDir = flowfield.lookup(pos); // 단위벡터

        // t=0일 때 가장 세게, t→1 로 갈수록 조금 약해짐
        const orbitStrength = map(t, 0, 1, 60, 15); // px/frame 정도 (필요하면 수치 조절)
        const orbitStep = flowDir.mult(orbitStrength);

        pos.add(orbitStep);

        // 🔁 2) 완전히 떠내려가지 않도록, baseTarget 쪽으로 서서히 끌어당김
        //     t가 커질수록(시간이 지날수록) 끌어당기는 비율도 조금씩 커지게
        const pullFactor = lerp(0.15, 0.35, t); // 0.2 ~ 0.45 정도로 서서히 증가
        pos = p5.Vector.lerp(pos, baseTarget, pullFactor);
      } else {
        // 기존 anchor seek 로직 (stage4가 아니거나 리더가 아닌 경우)
        let desired = p5.Vector.sub(baseTarget, pos);
        const d = desired.mag();
        desired.setMag(map(d, 0, width, this.initMaxSpeed * 0.2, this.initMaxSpeed));
        pos.add(desired);
      }

      this.position.set(pos);

      // ⏱ homeDurationMs(=20000ms) 끝나면 무조건 중심에 도달하도록 스냅
      if (t >= 1) {
        this.arrived = true;
        this.position.set(this.home);
      }
    } else {
      // 도착 후에는 중심에 붙어서 자전
      this.position.set(this.home);
      this.spinAngle += this.spinSpeed;
    }
  }

  // 정박 리더 이동(10초 귀소 → 도착 후 위치 고정 + 자전)
  _updateAnchoredMotion() {
    if (this.anchorRank === 0 || !this.home) return;

    const now = millis();
    const isStage4Leader =
      this.isLeader &&
      typeof stage !== 'undefined' &&
      stage === 4 &&
      flowfield?.lookup;

    if (!this.arrived) {
      const tRaw = (now - this.homeStartMs) / this.homeDurationMs;
      const t = constrain(tRaw, 0, 1);
      const ease = (u) => u * u * (3 - 2 * u);

      // 10초 동안 선형(이징)으로 homeStartPos → home 으로 이동
      const baseTarget = p5.Vector.lerp(this.homeStartPos, this.home, ease(t));
      let pos = this.position.copy();

      if (isStage4Leader) {
        // 🔄 흐름장 벡터(소용돌이 방향)
        const swirlDir = flowfield.lookup(pos);

        // 소용돌이 강도 (필요하면 숫자 조절)
        const swirlStrength = 20; // px 정도
        const swirl = swirlDir.mult(swirlStrength * (1 - t));
        // → 중심에 가까울수록 소용돌이 약해지게 (1 - t)

        // ① 흐름장을 타면서 한 번 이동
        pos.add(swirl);

        // ② 전체적으로는 baseTarget 으로 10초 안에 정확히 수렴하도록 보정
        //    (스냅이 아니라 부드럽게 끌려가게)
        pos = p5.Vector.lerp(pos, baseTarget, 0.35);
      } else {
        // 기존 anchor seek 로직 (stage4가 아니거나 리더가 아닌 경우)
        let desired = p5.Vector.sub(baseTarget, pos);
        const d = desired.mag();
        desired.setMag(map(d, 0, width, this.initMaxSpeed * 0.2, this.initMaxSpeed));
        pos.add(desired);
      }

      this.position.set(pos);

      // ⏱ homeDurationMs(=10초)가 끝나면 무조건 중심에 도달하도록 스냅
      if (t >= 1) {
        this.arrived = true;
        this.position.set(this.home);
      }
    } else {
      // 도착 후에는 중심에 붙어서 자전
      this.position.set(this.home);
      this.spinAngle += this.spinSpeed;
    }
  }
  // A creature can find food and eat it
  eat(food) {
    // Check all the food vectors
    let foodPos = food.foodPositions;     // 먹이 위치 정보 배열
    let radiusList = food.r;            // 먹이 크기 정보 배열
    let colorList = food.colors;            // 먹이 색 정보 배열
    this.touchedFood = false;          // 매 프레임마다 닿지 않음으로 초기화
    for (let i = foodPos.length - 1; i >= 0; i--) {       // 모든 먹이 위치를 순회
      const distance = p5.Vector.dist(this.position, foodPos[i]);   // 자신과 먹이 사이 거리
      const sumR = this.r + radiusList[i];     // ★ 먹이 반지름 반영
      if (distance < sumR) {    // 닿았다면
        this.health += 250;   // 체력 회복
        this.maxspeed = min(this.maxspeed + 5, this.initMaxSpeed);     // maxspeed 회복
        radiusList[i] -= 0.001;      // 해당 먹이 크기 감소
        if (radiusList[i] <= 0) {    //먹이 크기가 2보다 작으면
          foodPos.splice(i, 1);    // 해당 위치정보 배열에서 삭제
          radiusList.splice(i, 1);  // 해당 크기정보 배열에서 삭제
          colorList.splice(i, 1);
        }
        this.touchedFood = true;   // ★ food를 먹으면 true
      }
    }
  }

  // At any moment there is a teeny, tiny chance a bloop will reproduce
  reproduce() {
    let child = null;
    if (random(1) < reproduceRate) {
      let childDNA = this.dna.copy();
      // 부모의 현재 진화 단계를 확실히 넘겨주기
      childDNA.genes[2] = this.evolutionStep;
      childDNA.mutate(mutateRate);          // 전역변수 mutateRate
      // this.constructor를 사용해 자식 인스턴스를 생성
      child = new this.constructor(this.position.copy(), childDNA);
    }
    return child;
  }

  // 물리 업데이트 함수
  update() {
    const isStage4Leader =
      this.isLeader && typeof stage !== 'undefined' && stage === 4;

    // 정박 리더면 별도 이동 로직
    if (this.anchorRank > 0 && this.home) {
      this._updateAnchoredMotion();

      // ✅ stage 4 리더는 체력이 줄지 않도록 고정
      if (isStage4Leader) {
        this.health = this.initHealth;
      } else {
        this.health -= 0.05;
      }
      return;
    }

    // Simple movement based on perlin noise
    let vx = map(noise(this.xoff), 0, 1, -this.maxspeed, this.maxspeed);
    let vy = map(noise(this.yoff), 0, 1, -this.maxspeed, this.maxspeed);
    this.velocity = createVector(vx, vy);
    this.xoff += 0.01;
    this.yoff += 0.01;

    // 반경 50px 안에 먹이가 있으면 그쪽으로 살짝 방향 보정
    this._seekNearbyFood(200);

    // 흐름장 드리프트는 stage 4에서만
    if (typeof stage !== 'undefined' && stage === 4 && flowfield?.lookup) {
      const drift = flowfield.lookup(this.position).mult(this.initMaxSpeed * 1.0);
      this.position.add(drift);
    }

    this.position.add(this.velocity);

    // ▼ 스폰(등장) 중이면 health를 0→initHealth로 3초간 보간
    if (this.isSpawning) {
      const tRaw = (millis() - this.spawnStartMs) / this.spawnDurationMs;
      // 부드러운 이징(원한다면): u*u*(3-2*u). 선형이면 그냥 t=constrain(tRaw,0,1)
      const u = constrain(tRaw, 0, 1);
      const t = u * u * (3 - 2 * u);

      this.health = lerp(0, this.initHealth, t);
      this.spawnScale = lerp(0.6, 1.0, t);   // 살짝 커지며 등장(선택)

      if (u >= 1) {
        this.isSpawning = false;
        this.spawnScale = 1.0;
        this.health = this.initHealth;       // 스폰 종료 시 정확히 정착
      }
    } else {
      if (isStage4Leader) {
        // ✅ stage 4 리더는 항상 풀피 유지
        this.health = this.initHealth;
      } else {
        this.health -= 0.1;       // 체력이 점점 줄어듦
        if (this.health < this.initHealth * 0.2) {  // 체력이 20%로 줄어들면
          this.maxspeed = 0.1;      // 느려짐
        }
      }
    }
  }

  // ★ 주변 먹이를 향해 살짝 방향을 틀어주는 헬퍼
  _seekNearbyFood(visionRange = 100) {
    // 전역 world / world.food 사용
    if (!world || !world.food) return;

    const foodPos = world.food.foodPositions;
    const radiusList = world.food.r;

    if (!foodPos || foodPos.length === 0) return;

    let closest = null;
    let closestDist = Infinity;

    for (let i = 0; i < foodPos.length; i++) {
      const pos = foodPos[i];
      const d = p5.Vector.dist(this.position, pos);
      if (d === 0 || d > visionRange) continue; // 반경 바깥이면 무시

      if (d < closestDist) {
        closestDist = d;
        closest = pos;
      }
    }

    // 반경 안에 아무 먹이도 없으면 그대로 노이즈 이동
    if (!closest) return;

    // 먹이 방향 벡터
    const desired = p5.Vector.sub(closest, this.position);
    if (desired.magSq() === 0) return;

    // 이 생명체가 낼 수 있는 속도 크기 기준으로 맞춰주고
    desired.setMag(this.maxspeed);

    // 지금 노이즈 기반 속도(this.velocity)와
    // 먹이 방향(desired)을 섞어서 살~짝 먹이 쪽으로 틀기
    const STEER_AMOUNT = 0.08; // 0.05~0.2 사이에서 취향껏 조절
    this.velocity.lerp(desired, STEER_AMOUNT);
  }

  // 화면 경계 처리 함수
  borders() {
    const m = 0;
    const r = this.r * 2;
    if (this.position.x < m - r) {
      this.isBorder = true;
      this.position.x = width - m + r;
    }
    if (this.position.y < m - r) {
      this.isBorder = true;
      this.position.y = height + - m + r;
    }
    if (this.position.x > width - m + r) {
      this.isBorder = true;
      this.position.x = m - r;
    }
    if (this.position.y > height - m + r) {
      this.isBorder = true;
      this.position.y = m - r;
    }
  }

  // 화면에 표시하는 메서드(상속됨)
  show() {
    // push();
    // translate(this.position.x, this.position.y); // 좌표계의 원점을 자신의 위치로 이동

    // // 몸체 그리기
    // stroke(this.currentColor);
    // fill(this.currentColor);
    // circle(0, 0, this.r * 2);

    // pop();
  }

  calCurrentColor() {
    let amt = map(this.health, this.initHealth, 0, 0, 1);   // health값 0~1로 정규화
    this.currentColor = lerpColor(this.baseC1, backgroundColor, amt);
    this.c2 = lerpColor(this.baseC2, backgroundColor, amt);
    this.c3 = lerpColor(this.baseC3, backgroundColor, amt);
    this.c4 = lerpColor(this.baseC4, backgroundColor, amt);
    this.bl = lerpColor(this.black, backgroundColor, amt);
    this.wh = lerpColor(this.white, backgroundColor, amt);
  }

  // 죽음
  dead() {
    // ✅ stage 4 리더는 절대 죽지 않음
    if (this.isLeader && typeof stage !== 'undefined' && stage === 4) {
      return false;
    }
    return this.health < 0.0;
  }

}