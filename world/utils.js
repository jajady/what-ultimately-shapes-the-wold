// utils.js (또는 스케치 상단)
function randomPosInCenterDisk(opts = {}) {
  const cx = opts.center?.x ?? width / 2;
  const cy = opts.center?.y ?? height / 2;

  // 기본 반경: 화면 최소변/2 - margin
  const RmaxDefault = Math.min(width, height) / 2 - (typeof margin === 'number' ? margin : 0);
  const Rmax = Math.max(0, opts.radius ?? RmaxDefault);

  // 도넛(안쪽 비우기)도 지원
  const Rin = Math.max(0, opts.innerRadius ?? 0);
  const theta = random(TWO_PI);
  const r = sqrt(random()) * (Rmax - Rin) + Rin;   // 면적 균일!

  return createVector(cx + r * cos(theta), cy + r * sin(theta));
}

