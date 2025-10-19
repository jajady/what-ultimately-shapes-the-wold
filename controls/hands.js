// hand.js
//---- 비디오/손 인식 ----//
let video;      // 웹캠 영상을 담을 변수
let handPose;   // ml5.js의 손 인식 모델을 담을 변수
let hands = [];   // 감지된 손의 결과 데이터를 담을 배열
let emitters = [];
const MAX_HANDS = 2;

function preload() {       // ml5 handpose 준비
  handPose = ml5.handPose({ flipped: true });
}
function gotHands(results) {
  hands = results;
}
