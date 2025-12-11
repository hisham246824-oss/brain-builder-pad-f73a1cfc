import { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { TableCell, CellStyle } from './TableCell';
import { TableToolbar } from './TableToolbar';
import { TableDownloadWrapper } from './TableDownloadWrapper';
import { useTableData } from '@/hooks/useTableData';

export function TableEditor() {
  const {
    rows,
    cols,
    cells,
    getCellData,
    updateCellValue,
    updateCellStyle,
    setRows,
    setCols,
    defaultStyle,
  } = useTableData();
  
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const handleStyleChange = (style: Partial<CellStyle>) => {
    if (!selectedCell) return;
    updateCellStyle(selectedCell, style);
  };

  const handleDownload = useCallback(async () => {
    if (!downloadRef.current) return;

    try {
      // Temporarily remove selection styling for clean export
      setSelectedCell(null);
      
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(downloadRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `studyhub-table-${Date.now()}.png`;
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
  };

  const handleColsChange = (newCols: number) => {
    setCols(newCols);
  };

  const selectedCellData = selectedCell ? cells[selectedCell] : null;

  const renderTable = (forExport: boolean = false) => (
    <div
      className={`inline-block min-w-full bg-white rounded-2xl border border-border overflow-hidden ${!forExport ? 'shadow-card' : ''}`}
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
                onChange={(value) => !forExport && updateCellValue(rowIndex, colIndex, value)}
                isSelected={!forExport && selectedCell === key}
                onSelect={() => !forExport && setSelectedCell(key)}
              />
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <TableToolbar
        rows={rows}
        cols={cols}
        onRowsChange={handleRowsChange}
        onColsChange={handleColsChange}
        selectedStyle={selectedCellData?.style || null}
        onStyleChange={handleStyleChange}
        onDownload={handleDownload}
        hasSelection={!!selectedCell}
      />

      <div className="overflow-x-auto">
        {renderTable(false)}
      </div>

      {/* Hidden wrapper for download with branding */}
      <div className="absolute -left-[9999px] top-0">
        <TableDownloadWrapper ref={downloadRef}>
          {renderTable(true)}
        </TableDownloadWrapper>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Click on any cell to edit. Use the toolbar above to format selected cells. Data is automatically saved.
      </p>
    </div>
  );
}
