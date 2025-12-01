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
// 🎵 진화(색 입히기) 효과음
let evolveSfx;

function preload() {       // ml5 handpose 준비
  // handPose = ml5.handPose({ flipped: true });
  // ✅ MediaPipe Hands 런타임으로 초기화 (TFHub 사용 안 함)
  handPose = ml5.handPose({
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands', // 런타임 리소스 경로
    modelType: 'full',   // 'lite' | 'full'
    maxHands: 2
    // flipped 옵션은 구버전 전용이었으니, 캔버스를 미러링해서 처리
  });

  // 음원
  // https://pixabay.com/sound-effects/uplifting-pad-texture-113842/
  tracks[1] = loadSound('assets/uplifting-pad-texture-113842.mp3');
  // Angelic Pad Loop.wav by PhonZz -- https://freesound.org/s/242773/ -- License: Creative Commons 0
  tracks[2] = loadSound('assets/angelic-pad-loopwav-14643.mp3');
  // https://pixabay.com/sound-effects/016133-harmony-of-peace-56085/
  tracks[3] = loadSound('assets/016133_harmony-of-peace-56085.mp3');

  // tracks[4] = loadSound('assets/denied-access-density-time.mp3');
  tracks[4] = loadSound('assets/beautiful-time-lapse-116203.mp3');

  // https://pixabay.com/sound-effects/silver-chime-290187/
  evolveSfx = loadSound('assets/silver-chime.mp3', () => {
    evolveSfx.setVolume(3.0);   // ★ 0.0 ~ 1.0 사이, 원하는 값으로
  });
}

function gotHands(results) {
  hands = results;
}
