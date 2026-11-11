export const PATH = {
  p0: [16, 32],
  c1: [46, 28],
  c2: [70, 18],
  p3: [82, 16],
};

export const PATH_D = `M ${PATH.p0.join(' ')} C ${PATH.c1.join(' ')}, ${PATH.c2.join(' ')}, ${PATH.p3.join(' ')}`;

export function pointOnPath(t) {
  const clamped = Math.min(1, Math.max(0, t));
  const { p0, c1, c2, p3 } = PATH;
  const u = 1 - clamped;
  const x = u ** 3 * p0[0] + 3 * u ** 2 * clamped * c1[0] + 3 * u * clamped ** 2 * c2[0] + clamped ** 3 * p3[0];
  const y = u ** 3 * p0[1] + 3 * u ** 2 * clamped * c1[1] + 3 * u * clamped ** 2 * c2[1] + clamped ** 3 * p3[1];
  const dx = 3 * u ** 2 * (c1[0] - p0[0]) + 6 * u * clamped * (c2[0] - c1[0]) + 3 * clamped ** 2 * (p3[0] - c2[0]);
  const dy = 3 * u ** 2 * (c1[1] - p0[1]) + 6 * u * clamped * (c2[1] - c1[1]) + 3 * clamped ** 2 * (p3[1] - c2[1]);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { x, y, angle };
}
