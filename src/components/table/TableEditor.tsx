import { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { TableCell, CellStyle } from './TableCell';
import { TableToolbar } from './TableToolbar';

interface CellData {
  value: string;
  style: CellStyle;
}

const defaultStyle: CellStyle = {
  color: '#1a1a2e',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  backgroundColor: '#ffffff',
};

export function TableEditor() {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [cells, setCells] = useState<Record<string, CellData>>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const getCellData = (row: number, col: number): CellData => {
    const key = getCellKey(row, col);
    return cells[key] || { value: '', style: { ...defaultStyle } };
  };

  const updateCellValue = (row: number, col: number, value: string) => {
    const key = getCellKey(row, col);
    setCells((prev) => ({
      ...prev,
      [key]: { ...getCellData(row, col), value },
    }));
  };

  const updateCellStyle = (style: Partial<CellStyle>) => {
    if (!selectedCell) return;
    setCells((prev) => ({
      ...prev,
      [selectedCell]: {
        ...prev[selectedCell] || { value: '', style: { ...defaultStyle } },
        style: {
          ...(prev[selectedCell]?.style || defaultStyle),
          ...style,
        },
      },
    }));
  };

  const handleDownload = useCallback(async () => {
    if (!tableRef.current) return;

    try {
      // Temporarily remove selection styling for clean export
      setSelectedCell(null);
      
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(tableRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          borderRadius: '16px',
        },
      });

      const link = document.createElement('a');
      link.download = `table-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Table downloaded successfully!');
    } catch (error) {
      console.error('Failed to download table:', error);
      toast.error('Failed to download table');
    }
  }, []);

  const handleRowsChange = (newRows: number) => {
    setRows(newRows);
    // Clean up cells that are no longer in range
    setCells((prev) => {
      const updated: Record<string, CellData> = {};
      Object.entries(prev).forEach(([key, data]) => {
        const [row] = key.split('-').map(Number);
        if (row < newRows) {
          updated[key] = data;
        }
      });
      return updated;
    });
  };

  const handleColsChange = (newCols: number) => {
    setCols(newCols);
    // Clean up cells that are no longer in range
    setCells((prev) => {
      const updated: Record<string, CellData> = {};
      Object.entries(prev).forEach(([key, data]) => {
        const [, col] = key.split('-').map(Number);
        if (col < newCols) {
          updated[key] = data;
        }
      });
      return updated;
    });
  };

  const selectedCellData = selectedCell ? cells[selectedCell] : null;

  return (
    <div className="space-y-6">
      <TableToolbar
        rows={rows}
        cols={cols}
        onRowsChange={handleRowsChange}
        onColsChange={handleColsChange}
        selectedStyle={selectedCellData?.style || null}
        onStyleChange={updateCellStyle}
        onDownload={handleDownload}
        hasSelection={!!selectedCell}
      />

      <div className="overflow-x-auto">
        <div
          ref={tableRef}
          className="inline-block min-w-full bg-card rounded-2xl border border-border overflow-hidden shadow-card"
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))`,
            }}
          >
            {Array.from({ length: rows }).map((_, rowIndex) =>
              Array.from({ length: cols }).map((_, colIndex) => {
                const key = getCellKey(rowIndex, colIndex);
                const cellData = getCellData(rowIndex, colIndex);
                const isHeader = rowIndex === 0;

                return (
                  <TableCell
                    key={key}
                    value={cellData.value}
                    style={{
                      ...cellData.style,
                      fontWeight: isHeader && cellData.style.fontWeight === 'normal' ? 'bold' : cellData.style.fontWeight,
                      backgroundColor: isHeader && cellData.style.backgroundColor === '#ffffff' 
                        ? '#f8f9fa' 
                        : cellData.style.backgroundColor,
                    }}
                    onChange={(value) => updateCellValue(rowIndex, colIndex, value)}
                    isSelected={selectedCell === key}
                    onSelect={() => setSelectedCell(key)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Click on any cell to edit. Use the toolbar above to format selected cells.
      </p>
    </div>
  );
}
