export function ArtistName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const displayName = name === 'BLACKPINK' ? 'BLACK PINK' : name;
  const shouldStack = displayName === 'BLACK PINK';

  if (!shouldStack) {
    return <span className={className}>{displayName}</span>;
  }

  return (
    <span className={[className, 'artist-name-stack'].filter(Boolean).join(' ')} aria-label={displayName}>
      <span>BLACK</span>
      <span>PINK</span>
    </span>
  );
}
