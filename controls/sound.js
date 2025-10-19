// sound.js
// 사용자 입력으로 오디오 활성화(Chrome 오토플레이 정책 회피)
function ensureAudio() {
  if (!audioReady) {
    userStartAudio(); // p5 제공. 한 번만 호출되면 됨.
    audioReady = true;
  }
}

// 부드러운 페이드 아웃/인 도우미
function fadeOutAndStop(snd, sec = 0.6) {
  if (!snd) return;
  snd.setVolume(0, sec);                   // sec초 동안 0으로 페이드
  setTimeout(() => snd.stop(), sec * 1000);
}

function fadeIn(snd, target = 0.8, sec = 0.8) {
  if (!snd) return;
  if (!snd.isPlaying()) snd.play();
  snd.setVolume(target, sec);              // sec초 동안 target 볼륨까지 페이드인
}

// 예: 1스테이지는 조용, 3스테이지는 좀 더 큼
const stageVolumes = { 1: 0.5, 2: 0.7, 3: 0.9, 4: 0.8 };

function playStageMusic(stageNum) {
  const next = tracks[stageNum];
  if (!next) return;
  if (currentTrack === next) return;

  const vol = stageVolumes[stageNum] ?? 0.8;

  // 이전 곡 부드럽게 종료
  if (currentTrack) fadeOutAndStop(currentTrack, 0.6);

  // 새 곡 재생
  next.stop(); // 혹시 이전 루프가 남아있을 수도 있으니 정리
  next.play();
  next.setVolume(0);
  next.setVolume(vol, 0.8);
  currentTrack = next;

  // ✅ 곡이 끝나면 자동으로 다시 재생 (루프처럼 동작)
  next.onended(() => {
    // 여전히 현재 트랙이 같은 곡일 때만 재시작
    if (currentTrack === next) {
      next.play();
      next.setVolume(vol);
    }
  });
}