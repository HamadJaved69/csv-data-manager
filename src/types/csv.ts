export interface CSVRow {
  [key: string]: string | number | boolean;
}

export interface CSVData {
  headers: string[];
  rows: CSVRow[];
}

export interface EditableCell {
  rowIndex: number;
  columnKey: string;
  value: string | number | boolean;
} 