import {
  Add as AddIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  SelectChangeEvent,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useMemo, useState } from 'react';
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

  // New state for grouping and highlighting
  const [groupByColumn, setGroupByColumn] = useState<string>('');
  const [enableHighlighting, setEnableHighlighting] = useState(true);
  const [showGroupHeaders, setShowGroupHeaders] = useState(false);

  // New state for filters
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for each column for filter dropdowns
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

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((row) => {
      // Apply search filter
      const matchesSearch = searchTerm === '' ||
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Apply column filters
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

  // Reset page when search, sort, or filters change
  React.useEffect(() => {
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
    onDataUpdate([...data, newRow]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const updatedData = data.filter((_, index) => index !== rowIndex);
    onDataUpdate(updatedData);
  };

  const getRowHighlight = (row: CSVRow) => {
    if (!enableHighlighting || !groupByColumn) {
      return 'transparent';
    }

    const value = String(row[groupByColumn] || '').toLowerCase();

    // Fallback: generate a color based on the value
    if (value) {
      const hash = value.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 70%, 90%)`;
    }

    return 'transparent';
  };

  // Group data by the selected column
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

    // Convert back to array with group headers
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Data Table ({filteredAndSortedData.length} of {data.length} rows)
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />

          <Tooltip title={`Filters (${getActiveFiltersCount()} active)`}>
            <Button
              variant={getActiveFiltersCount() > 0 ? "contained" : "outlined"}
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              color={getActiveFiltersCount() > 0 ? "warning" : "primary"}
            >
              Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </Button>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
          >
            Add Row
          </Button>

          <Tooltip title={`Save data to CSV file${hasUnsavedChanges ? ' (Ctrl+S)' : ''}`}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={onSave}
              color={hasUnsavedChanges ? "warning" : "primary"}
              sx={{
                position: 'relative',
                ...(hasUnsavedChanges && {
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.7)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(255, 152, 0, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(255, 152, 0, 0)' },
                  }
                })
              }}
            >
              {hasUnsavedChanges ? 'Save*' : 'Save'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters Panel */}
      <Collapse in={showFilters}>
        <Paper sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Column Filters
            </Typography>
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
              disabled={getActiveFiltersCount() === 0}
            >
              Clear All
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            {headers.map((header) => (
              <Box key={header} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 200 }} fullWidth variant="outlined">
                  <InputLabel id={`filter-${header}-label`}>{header}</InputLabel>
                  <Select
                    labelId={`filter-${header}-label`}
                    id={`filter-${header}`}
                    value={filters[header] || `All ${header}`}
                    label={header}
                    onChange={(e: SelectChangeEvent<string>) => handleFilterChange(header, e.target.value)}
                    displayEmpty
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300
                        }
                      }
                    }}
                    renderValue={(selected: string) => {
                      if (!selected) {
                        return <em>All {header}</em>;
                      }
                      return selected;
                    }}
                  >
                    <MenuItem value="">
                      <em>All {header}</em>
                    </MenuItem>
                    {Array.from(columnValues[header]).sort().map((value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {filters[header] && (
                  <IconButton
                    size="small"
                    onClick={() => clearFilter(header)}
                    color="error"
                  >
                    <ClearIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      </Collapse>

      {/* Grouping and Highlighting Controls */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={enableHighlighting}
              onChange={(e) => setEnableHighlighting(e.target.checked)}
            />
          }
          label="Enable Highlighting"
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Group By Column</InputLabel>
          <Select
            value={groupByColumn}
            label="Group By Column"
            onChange={(e) => setGroupByColumn(e.target.value)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {headers.map((header) => (
              <MenuItem key={header} value={header}>
                {header}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={showGroupHeaders}
              onChange={(e) => setShowGroupHeaders(e.target.checked)}
              disabled={!groupByColumn}
            />
          }
          label="Show Group Headers"
        />
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell key={header}>
                  <TableSortLabel
                    active={sortColumn === header}
                    direction={sortColumn === header ? sortDirection : 'asc'}
                    onClick={() => handleSort(header)}
                  >
                    {header}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupedData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                const rowIndex = page * rowsPerPage + index;

                // Handle group headers
                if ('isGroupHeader' in row) {
                  return (
                    <TableRow key={`group-${row.groupValue}`}>
                      <TableCell
                        colSpan={headers.length + 1}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        {row.groupValue} ({row.count} items)
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow
                    key={rowIndex}
                    sx={{
                      backgroundColor: getRowHighlight(row),
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {headers.map((header) => (
                      <TableCell
                        key={header}
                        onClick={() => handleCellClick(rowIndex, header, String(row[header] || ''))}
                        sx={{ cursor: 'pointer' }}
                      >
                        {editingCell?.rowIndex === rowIndex && editingCell?.columnKey === header ? (
                          <TextField
                            value={editValue}
                            onChange={handleCellEdit}
                            onKeyDown={handleKeyPress}
                            onBlur={handleCellSave}
                            size="small"
                            autoFocus
                            fullWidth
                            variant="standard"
                          />
                        ) : (
                          <Box>
                            {String(row[header] || '')}
                            {row[header] && (
                              <Chip
                                label={String(row[header])}
                                size="small"
                                sx={{ ml: 1, maxWidth: 100 }}
                              />
                            )}
                          </Box>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Tooltip title="Delete row">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRow(rowIndex)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={groupedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default CSVDataTable;