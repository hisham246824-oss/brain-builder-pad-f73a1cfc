import { useState, useEffect, useCallback } from 'react';
import { CellStyle } from '@/components/table/TableCell';

interface CellData {
  value: string;
  style: CellStyle;
}

interface TableData {
  rows: number;
  cols: number;
  cells: Record<string, CellData>;
}

const STORAGE_KEY = 'table-data';

const defaultStyle: CellStyle = {
  color: '#1a1a2e',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  backgroundColor: '#ffffff',
};

const defaultData: TableData = {
  rows: 3,
  cols: 3,
  cells: {},
};

export function useTableData() {
  const [data, setData] = useState<TableData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(defaultData);
      }
    }
    setIsLoading(false);
  }, []);

  const saveData = useCallback((newData: TableData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const getCellData = useCallback((row: number, col: number): CellData => {
    const key = getCellKey(row, col);
    return data.cells[key] || { value: '', style: { ...defaultStyle } };
  }, [data.cells]);

  const updateCellValue = useCallback((row: number, col: number, value: string) => {
    const key = getCellKey(row, col);
    const currentCell = data.cells[key] || { value: '', style: { ...defaultStyle } };
    const newCells = {
      ...data.cells,
      [key]: { ...currentCell, value },
    };
    saveData({ ...data, cells: newCells });
  }, [data, saveData]);

  const updateCellStyle = useCallback((cellKey: string, styleUpdate: Partial<CellStyle>) => {
    const currentCell = data.cells[cellKey] || { value: '', style: { ...defaultStyle } };
    const newCells = {
      ...data.cells,
      [cellKey]: {
        ...currentCell,
        style: { ...currentCell.style, ...styleUpdate },
      },
    };
    saveData({ ...data, cells: newCells });
  }, [data, saveData]);

  const setRows = useCallback((newRows: number) => {
    const cleanedCells: Record<string, CellData> = {};
    Object.entries(data.cells).forEach(([key, cellData]) => {
      const [row] = key.split('-').map(Number);
      if (row < newRows) {
        cleanedCells[key] = cellData;
      }
    });
    saveData({ ...data, rows: newRows, cells: cleanedCells });
  }, [data, saveData]);

  const setCols = useCallback((newCols: number) => {
    const cleanedCells: Record<string, CellData> = {};
    Object.entries(data.cells).forEach(([key, cellData]) => {
      const [, col] = key.split('-').map(Number);
      if (col < newCols) {
        cleanedCells[key] = cellData;
      }
    });
    saveData({ ...data, cols: newCols, cells: cleanedCells });
  }, [data, saveData]);

  const clearTable = useCallback(() => {
    saveData({ ...data, cells: {} });
  }, [data, saveData]);

  return {
    rows: data.rows,
    cols: data.cols,
    cells: data.cells,
    isLoading,
    getCellData,
    updateCellValue,
    updateCellStyle,
    setRows,
    setCols,
    clearTable,
    defaultStyle,
  };
}
