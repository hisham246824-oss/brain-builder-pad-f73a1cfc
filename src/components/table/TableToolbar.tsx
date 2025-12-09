import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Palette, Download, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CellStyle } from './TableCell';

interface TableToolbarProps {
  rows: number;
  cols: number;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  selectedStyle: CellStyle | null;
  onStyleChange: (style: Partial<CellStyle>) => void;
  onDownload: () => void;
  hasSelection: boolean;
}

const PRESET_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560',
  '#f39c12', '#27ae60', '#3498db', '#9b59b6', '#1abc9c',
  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#adb5bd',
];

export function TableToolbar({
  rows,
  cols,
  onRowsChange,
  onColsChange,
  selectedStyle,
  onStyleChange,
  onDownload,
  hasSelection,
}: TableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-2xl border border-border shadow-card">
      {/* Table Size Controls */}
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Rows</Label>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onRowsChange(Math.max(1, rows - 1))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center font-medium">{rows}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onRowsChange(Math.min(20, rows + 1))}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Cols</Label>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onColsChange(Math.max(1, cols - 1))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center font-medium">{cols}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onColsChange(Math.min(10, cols + 1))}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <Button
          variant={selectedStyle?.fontWeight === 'bold' ? 'default' : 'outline'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onStyleChange({ fontWeight: selectedStyle?.fontWeight === 'bold' ? 'normal' : 'bold' })}
          disabled={!hasSelection}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={selectedStyle?.fontStyle === 'italic' ? 'default' : 'outline'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onStyleChange({ fontStyle: selectedStyle?.fontStyle === 'italic' ? 'normal' : 'italic' })}
          disabled={!hasSelection}
        >
          <Italic className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Alignment */}
      <div className="flex items-center gap-1">
        <Button
          variant={selectedStyle?.textAlign === 'left' ? 'default' : 'outline'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onStyleChange({ textAlign: 'left' })}
          disabled={!hasSelection}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={selectedStyle?.textAlign === 'center' ? 'default' : 'outline'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onStyleChange({ textAlign: 'center' })}
          disabled={!hasSelection}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={selectedStyle?.textAlign === 'right' ? 'default' : 'outline'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onStyleChange({ textAlign: 'right' })}
          disabled={!hasSelection}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Size</Label>
        <Input
          type="number"
          min={10}
          max={32}
          value={selectedStyle?.fontSize || 14}
          onChange={(e) => onStyleChange({ fontSize: Number(e.target.value) })}
          className="w-16 h-8 rounded-lg"
          disabled={!hasSelection}
        />
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Colors */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 rounded-lg" disabled={!hasSelection}>
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Text Color</span>
            <div
              className="w-4 h-4 rounded border border-border"
              style={{ backgroundColor: selectedStyle?.color || '#1a1a2e' }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className="w-7 h-7 rounded-lg border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => onStyleChange({ color })}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 rounded-lg" disabled={!hasSelection}>
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Background</span>
            <div
              className="w-4 h-4 rounded border border-border"
              style={{ backgroundColor: selectedStyle?.backgroundColor || '#ffffff' }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className="w-7 h-7 rounded-lg border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => onStyleChange({ backgroundColor: color })}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex-1" />

      {/* Download */}
      <Button onClick={onDownload} className="gap-2 rounded-xl">
        <Download className="h-4 w-4" />
        Download as Image
      </Button>
    </div>
  );
}
