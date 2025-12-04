// zoom.js
// ==== 핀치/줌 파라미터 ====
let handPoints = [];        // 화면 좌표(여러 손)
let handPointsWorld = [];   // 월드 좌표(줌/중심 반영 후)

const PINCH_THRESH = 40;   // 각 손의 엄지-검지 거리 임계값(px)
const ZOOM_DEAD_RATIO = 0; // 4% 이내 변화는 무시 (원하면 0.03~0.06 사이로 조절)
let zoom = 1.0;            // 현재 줌 1.0
let targetZoom = 1.0;      // 목표 줌(스무딩용) 초기값 1.0
let minZoom = 1.0;         // 화면보다 작게 보이지 않도록 최소 1.0
let maxZoom = 20.0;         // 필요에 따라 조절
const ZOOM_SMOOTH = 0.5;  // lerp 계수(부드러움)

let zoomActive = false;    // 두 손 모두 핀치 중?
let zoomStartDist = 0;     // 줌 시작 시 두 검지 사이 거리
let zoomBase = 1.0;        // 줌 시작 직전 zoom
let zoomCenter = { x: 0, y: 0 };      // 현재 프레임의 줌 기준점
let lastZoomCenter = { x: 0, y: 0 };  // 핀치가 끊겨도 유지할 기준점

// 안전하게 키포인트 얻기(ml5 버전 호환)
function getKP(hand, name) {
  if (!hand) return null; // hand가 없으면 안전하게 null 반환

  // 새 버전
  if (hand.keypoints) {
    // keypoints 배열에서 name이 같은 항목을 찾아 반환
    return hand.keypoints.find(k => k.name === name) || null;
  }

  // 구 버전
  return hand[name] || null;
}

// 손 하나가 "핀치" 상태인지(엄지-검지 거리 < 임계값)
function isPinching(hand) {
  const tipIndex = getKP(hand, 'index_finger_tip');
  const tipThumb = getKP(hand, 'thumb_tip');
  if (!(tipIndex && tipThumb)) return false;
  return dist(tipIndex.x, tipIndex.y, tipThumb.x, tipThumb.y) < PINCH_THRESH;
}

// 두 손의 검지 끝 사이 거리와 그 중점
function indexDistanceAndMid(h1, h2) {
  const i1 = getKP(h1, 'index_finger_tip');   // 왼손 검지
  const i2 = getKP(h2, 'index_finger_tip');   // 오른손 검지
  if (!(i1 && i2)) return null;               // 인식 안되면 null 반환
  const d = dist(i1.x, i1.y, i2.x, i2.y);     // 두 검지 끝 사이의 거리
  const mid = { x: (i1.x + i2.x) * 0.5, y: (i1.y + i2.y) * 0.5 };   //두 검지 사이 중점(평균)
  return { d, mid };
}

// 확대/축소
function updateZoomState() {
  if (hands.length >= 2) {                // 인식된 손이 2개 이상일 때만 실행.
    const h1 = hands[0], h2 = hands[1];   // 첫 번째 손, 두 번째 손
    const p1 = isPinching(h1);            // 각 손이 핀치 중인지 검사
    const p2 = isPinching(h2);

    if (p1 && p2) {                     // 두 손 모두 핀치 상태일 때
      const info = indexDistanceAndMid(h1, h2);
      if (info) {
        const { d, mid } = info;
        if (!zoomActive) {              // 1. 줌 모드 진입
          zoomActive = true;
          zoomStartDist = max(1, d);    // 두 검지 사이의 초기 거리(0 나눗셈 방지)
          zoomBase = zoom;              // 현재 줌 배율
          targetZoom = zoom;            // 바로 점프하지 않도록 현재값으로 초기화
          zoomCenter = { x: mid.x, y: mid.y };      // 확대 중심점
        } else {                        // 2. 줌 진행 중: 거리 비율만큼 배율
          // 	지금 두 손 사이 거리 d를 초기 거리 zoomStartDist로 나눈 비율(factor) 계산
          // 예) 처음 거리 200px → 현재 거리 400px → factor = 2 → 2배 확대
          const rawFactor = d / zoomStartDist;
          const delta = rawFactor - 1.0; // 1.0에서 얼마나 떨어졌는지 (비율 기준)

          //  손 사이 거리 변화가 너무 작으면(4% 이내) 줌 변경 무시
          if (Math.abs(delta) < ZOOM_DEAD_RATIO) {
            // zoomCenter도 그대로 두면 화면이 더 안정적
            // 필요하면 아래 한 줄만 유지해서 중심은 따라가게 할 수도 있음
            // zoomCenter = { x: mid.x, y: mid.y };
          } else {
            // dead zone을 벗어났을 때만 실제 줌 반영
            const newTarget = zoomBase * rawFactor;
            targetZoom = constrain(newTarget, minZoom, maxZoom);
            zoomCenter = { x: mid.x, y: mid.y };
          }
        }

        // 이번 프레임의 기준점을 저장(손 떼도 마지막 중심 유지)
        lastZoomCenter = { ...zoomCenter };   // zoomCenter의 x, y 값을 새로운 객체에 복사
        return;       // updateZoomState() 종료
      }
    }
  }
  // 줌 비활성
  zoomActive = false;
}

// /* HUD / 디버그 표시 */
// function drawHUD() {
//   if (debug) {
//     noStroke();
//     fill(255);
//     textSize(12);
//     textAlign(RIGHT, TOP);
//     text(
//       `zoom: ${zoom.toFixed(2)}\n` +
//       `target: ${targetZoom.toFixed(2)}\n` +
//       `stage: ${stage}\n`,
//       width - 10, 10
//     );
//   }
// }

function screenToWorld(pt) {
  const cx = lastZoomCenter.x, cy = lastZoomCenter.y;
  return {
    x: (pt.x - cx) / zoom + cx,
    y: (pt.y - cy) / zoom + cy
  };
}