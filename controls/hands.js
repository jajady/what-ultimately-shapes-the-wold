// hand.js
//---- 비디오/손 인식 ----//
let video;      // 웹캠 영상을 담을 변수
let handPose;   // ml5.js의 손 인식 모델을 담을 변수
let hands = [];   // 감지된 손의 결과 데이터를 담을 배열
let emitters = [];
const MAX_HANDS = 2;

// ==== BGM: 스테이지별 트랙 ====
let tracks = {};          // {1: SoundFile, 2: SoundFile, ...}
let currentTrack = null;  // 현재 재생 중인 트랙
let audioReady = false;   // 사용자 제스처로 오디오 활성화됐는지

function preload() {       // ml5 handpose 준비
  handPose = ml5.handPose({ flipped: true });

  // ★ 경로/파일명은 네 자원에 맞게 수정!
  tracks[1] = loadSound('../assets/uplifting-pad-texture-113842.mp3');
  tracks[2] = loadSound('../assets/angelic-pad-loopwav-14643.mp3');
  tracks[3] = loadSound('../assets/016133_harmony-of-peace-56085.mp3');
  tracks[4] = loadSound('../assets/Denied Access - Density & Time.mp3');
}

function gotHands(results) {
  hands = results;
}
