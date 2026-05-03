import { Languages } from 'lucide-react';

/** Decorative vocabulary logo: turquoise circle with a Languages icon. No glow. */
export function VocabularyLogo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
      }}
      aria-hidden="true"
    >
      <Languages size={size * 0.55} className="text-white" strokeWidth={2.4} />
    </div>
  );
}
