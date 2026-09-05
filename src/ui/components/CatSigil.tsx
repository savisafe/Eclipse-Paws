interface CatSigilProps {
  kind: 'luma' | 'nox';
}

export function CatSigil({ kind }: CatSigilProps) {
  const label = kind === 'luma' ? 'Лумус, хранитель света' : 'Нокс, хранитель теней';

  return (
    <div className={`cat-sigil cat-sigil--${kind}`} role="img" aria-label={label}>
      <span className="cat-sigil__ear cat-sigil__ear--left" />
      <span className="cat-sigil__ear cat-sigil__ear--right" />
      <span className="cat-sigil__face">
        <span className="cat-sigil__eye cat-sigil__eye--left" />
        <span className="cat-sigil__eye cat-sigil__eye--right" />
        <span className="cat-sigil__nose" />
      </span>
    </div>
  );
}
