import { useEffect } from 'preact/hooks';

interface CardsComponentProps {
  onDismiss?: () => void;
}

export function CardsComponent({ onDismiss }: CardsComponentProps) {
  useEffect(() => {
    // 3秒後に自動的に閉じる
    const timer = setTimeout(() => {
      onDismiss?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="effect-placeholder">
      <h2>Cards Effect</h2>
      <p>Coming soon... 🃏</p>
      <p style={{ fontSize: '12px', color: '#666' }}>
        Cards animation will be implemented here
      </p>
    </div>
  );
}