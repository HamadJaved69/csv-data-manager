import { useMemo, useState, useEffect } from 'react';
import { CSVRow } from '../types/csv';

interface CSVDataTableProps {
  data: CSVRow[];
  headers: string[];
  onDataUpdate: (data: CSVRow[]) => void;
  onSave: () => void;
  hasUnsavedChanges?: boolean;
}

type SortDirection = 'asc' | 'desc';

const CSVDataTable: React.FC<CSVDataTableProps> = ({
  data,
  headers,
  onDataUpdate,
  onSave,
  hasUnsavedChanges = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnKey: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [groupByColumn, setGroupByColumn] = useState<string>('');
  const [enableHighlighting, setEnableHighlighting] = useState(true);
  const [showGroupHeaders, setShowGroupHeaders] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const columnValues = useMemo(() => {
    const values: Record<string, Set<string>> = {};
    headers.forEach(header => {
      values[header] = new Set();
      data.forEach(row => {
        const value = String(row[header] || '').trim();
        if (value) {
          values[header].add(value);
        }
      });
    });
    return values;
  }, [data, headers]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((row) => {
      const matchesSearch = searchTerm === '' ||
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesFilters = Object.entries(filters).every(([column, filterValue]) => {
        if (!filterValue) return true;
        const cellValue = String(row[column] || '').toLowerCase();
        return cellValue.includes(filterValue.toLowerCase());
      });

      return matchesSearch && matchesFilters;
    });

    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = String(a[sortColumn] || '');
        const bValue = String(b[sortColumn] || '');

        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, filters]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, sortColumn, sortDirection, filters]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleCellClick = (rowIndex: number, columnKey: string, value: string) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(String(value));
  };

  const handleCellEdit = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(event.target.value);
  };

  const handleCellSave = () => {
    if (editingCell) {
      const updatedData = [...data];
      updatedData[editingCell.rowIndex] = {
        ...updatedData[editingCell.rowIndex],
        [editingCell.columnKey]: editValue,
      };
      onDataUpdate(updatedData);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleCellSave();
    } else if (event.key === 'Escape') {
      handleCellCancel();
    }
  };

  const handleAddRow = () => {
    const newRow: CSVRow = {};
    headers.forEach((header) => {
      newRow[header] = '';
    });

    const updatedData = [newRow, ...data];
    onDataUpdate(updatedData);
    setPage(0);

    setTimeout(() => {
      setEditingCell({ rowIndex: 0, columnKey: headers[0] });
      setEditValue('');
    }, 100);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const updatedData = data.filter((_, index) => index !== rowIndex);
    onDataUpdate(updatedData);
  };

  const getRowHighlight = (row: CSVRow) => {
    if (!enableHighlighting || !groupByColumn) {
      return '';
    }

    const value = String(row[groupByColumn] || '').toLowerCase();

    if (value) {
      const hash = value.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 70%, 92%)`;
    }

    return '';
  };

  const groupedData = useMemo(() => {
    if (!groupByColumn || !showGroupHeaders) {
      return filteredAndSortedData;
    }

    const groups: { [key: string]: CSVRow[] } = {};

    filteredAndSortedData.forEach(row => {
      const groupValue = String(row[groupByColumn] || 'Unknown');
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(row);
    });

    const result: (CSVRow | { isGroupHeader: true; groupValue: string; count: number })[] = [];

    Object.entries(groups).forEach(([groupValue, rows]) => {
      result.push({
        isGroupHeader: true,
        groupValue,
        count: rows.length
      });
      result.push(...rows);
    });

    return result;
  }, [filteredAndSortedData, groupByColumn, showGroupHeaders]);

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const clearFilter = (column: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value.trim() !== '').length;
  };

  const totalPages = Math.ceil(groupedData.length / rowsPerPage);
  const paginatedData = groupedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Data Table ({filteredAndSortedData.length} of {data.length} rows)
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-48"
          />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${getActiveFiltersCount() > 0 ? 'btn-warning' : 'btn-secondary'} inline-flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </button>

          <button
            onClick={handleAddRow}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Row
          </button>

          <button
            onClick={onSave}
            className={`btn inline-flex items-center gap-2 ${hasUnsavedChanges ? 'btn-warning animate-pulse-warning' : 'btn-primary'}`}
            title={hasUnsavedChanges ? 'Save data to CSV file (Ctrl+S)' : 'Save data to CSV file'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {hasUnsavedChanges ? 'Save*' : 'Save'}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-900">Column Filters</h3>
            <button
              onClick={clearAllFilters}
              disabled={getActiveFiltersCount() === 0}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {headers.map((header) => (
              <div key={header} className="flex items-center gap-2">
                <select
                  value={filters[header] || ''}
                  onChange={(e) => handleFilterChange(header, e.target.value)}
                  className="input text-sm flex-1"
                >
                  <option value="">All {header}</option>
                  {Array.from(columnValues[header]).sort().map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                {filters[header] && (
                  <button
                    onClick={() => clearFilter(header)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouping Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enableHighlighting}
            onChange={(e) => setEnableHighlighting(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Enable Highlighting</span>
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Group By:</label>
          <select
            value={groupByColumn}
            onChange={(e) => setGroupByColumn(e.target.value)}
            className="input text-sm w-40"
          >
            <option value="">None</option>
            {headers.map((header) => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showGroupHeaders}
            onChange={(e) => setShowGroupHeaders(e.target.checked)}
            disabled={!groupByColumn}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
          />
          <span className={`text-sm ${groupByColumn ? 'text-gray-700' : 'text-gray-400'}`}>
            Show Group Headers
          </span>
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    {header}
                    {sortColumn === header && (
                      <svg
                        className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium text-gray-700 w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, index) => {
              const rowIndex = page * rowsPerPage + index;

              if ('isGroupHeader' in row) {
                return (
                  <tr key={`group-${row.groupValue}`} className="bg-primary-600">
                    <td
                      colSpan={headers.length + 1}
                      className="px-4 py-2 text-white font-medium"
                    >
                      {row.groupValue} ({row.count} items)
                    </td>
                  </tr>
                );
              }

              const bgColor = getRowHighlight(row);

              return (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                  style={bgColor ? { backgroundColor: bgColor } : undefined}
                >
                  {headers.map((header) => (
                    <td
                      key={header}
                      onClick={() => handleCellClick(rowIndex, header, String(row[header] || ''))}
                      className="px-4 py-2 cursor-pointer"
                    >
                      {editingCell?.rowIndex === rowIndex && editingCell?.columnKey === header ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={handleCellEdit}
                          onKeyDown={handleKeyPress}
                          onBlur={handleCellSave}
                          autoFocus
                          className="w-full px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <span className="text-gray-900">{String(row[header] || '')}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete row"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            className="input text-sm w-20"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, groupedData.length)} of {groupedData.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVDataTable;
