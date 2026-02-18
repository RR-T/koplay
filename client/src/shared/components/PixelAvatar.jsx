export default function PixelAvatar({ avatar, size = 48, className = '' }) {
  if (!avatar || !avatar.id) return null;

  return (
    <img
      src={`/avatars/${avatar.id}.png`}
      alt={avatar.name}
      width={size}
      className={className}
      style={{ display: 'block' }}
    />
  );
}
