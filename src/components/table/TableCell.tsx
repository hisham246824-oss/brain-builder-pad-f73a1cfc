import { useRef, useEffect } from 'react';

export interface CellStyle {
  color: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
}

interface TableCellProps {
  value: string;
  style: CellStyle;
  onChange: (value: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

export function TableCell({ value, style, onChange, isSelected, onSelect }: TableCellProps) {
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  return (
    <div
      ref={inputRef}
      contentEditable
      suppressContentEditableWarning
      onClick={onSelect}
      onInput={(e) => onChange(e.currentTarget.textContent || '')}
      className={`min-h-[48px] px-3 py-2 border border-border outline-none transition-all cursor-text ${
        isSelected ? 'ring-2 ring-primary ring-offset-1' : 'hover:bg-muted/50'
      }`}
      style={{
        color: style.color,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        textAlign: style.textAlign,
        backgroundColor: style.backgroundColor,
      }}
    >
      {value}
    </div>
  );
}
