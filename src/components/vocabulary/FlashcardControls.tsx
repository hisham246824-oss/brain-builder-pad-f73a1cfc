import { Button } from '@/components/ui/button';
import { XCircle, HelpCircle, ThumbsUp, Star } from 'lucide-react';

interface FlashcardControlsProps {
  onRate: (quality: number) => void;
  disabled: boolean;
}

export function FlashcardControls({ onRate, disabled }: FlashcardControlsProps) {
  const buttons = [
    { quality: 1, label: 'Again', icon: XCircle, color: 'text-red-500 hover:bg-red-500/10' },
    { quality: 3, label: 'Hard', icon: HelpCircle, color: 'text-orange-500 hover:bg-orange-500/10' },
    { quality: 4, label: 'Good', icon: ThumbsUp, color: 'text-green-500 hover:bg-green-500/10' },
    { quality: 5, label: 'Easy', icon: Star, color: 'text-primary hover:bg-primary/10' },
  ];

  return (
    <div className="flex justify-center gap-3 mt-6">
      {buttons.map(({ quality, label, icon: Icon, color }) => (
        <Button
          key={quality}
          variant="outline"
          onClick={() => onRate(quality)}
          disabled={disabled}
          className={`flex flex-col items-center gap-1 h-auto py-3 px-4 rounded-2xl ${color}`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs">{label}</span>
        </Button>
      ))}
    </div>
  );
}
