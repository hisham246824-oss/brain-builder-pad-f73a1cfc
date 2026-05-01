import { Languages } from 'lucide-react';

/** Decorative vocabulary logo: turquoise gradient circle with a Languages icon. */
export function VocabularyLogo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, hsl(174 72% 56%), hsl(186 90% 42%))',
        boxShadow: '0 4px 14px hsl(174 72% 56% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.5)',
      }}
      aria-hidden="true"
    >
      <Languages size={size * 0.55} className="text-white drop-shadow-sm" strokeWidth={2.4} />
    </div>
  );
}
