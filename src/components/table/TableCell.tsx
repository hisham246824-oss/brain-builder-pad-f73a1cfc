import { useRef, useEffect, useState } from 'react';

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
  isHeader?: boolean;
}

export function TableCell({ value, style, onChange, isSelected, onSelect, isHeader }: TableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      dir="auto"
      value={localValue}
      onClick={onSelect}
      onChange={handleChange}
      className={`min-h-[48px] w-full px-3 py-2 border border-border outline-none transition-all bg-card text-foreground ${
        isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : 'hover:bg-muted/50'
      }`}
      style={{
        color: style.color === '#1a1a2e' ? undefined : style.color,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        textAlign: style.textAlign,
        backgroundColor: style.backgroundColor === '#ffffff' || style.backgroundColor === '#f8f9fa' ? undefined : style.backgroundColor,
      }}
    />
  );
}
