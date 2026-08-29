export const compareVersions = (left, right) => {
  const a = String(left || '0').split('.').map(Number);
  const b = String(right || '0').split('.').map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) - (b[index] || 0);
  }
  return 0;
};
