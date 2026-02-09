export default function PixelAvatar({ avatar, size = 48, className = '' }) {
  if (!avatar || !avatar.grid) return null;

  const rects = [];
  for (let y = 0; y < avatar.grid.length; y++) {
    for (let x = 0; x < avatar.grid[y].length; x++) {
      const color = avatar.grid[y][x];
      if (color) {
        rects.push(
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />
        );
      }
    }
  }

  return (
    <svg
      viewBox="0 0 10 10"
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    >
      {rects}
    </svg>
  );
}
