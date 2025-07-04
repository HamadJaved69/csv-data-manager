import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import CSVDataTable from './components/CSVDataTable';
import FileUpload from './components/FileUpload';
import { CSVRow } from './types/csv';

function App() {
  const [data, setData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleDataLoad = (newData: CSVRow[], newHeaders: string[]) => {
    setData(newData);
    setHeaders(newHeaders);
    setNotification({
      message: `Successfully loaded ${newData.length} rows of data`,
      severity: 'success',
    });
  };

  const handleDataUpdate = (updatedData: CSVRow[]) => {
    setData(updatedData);
    setHasUnsavedChanges(true);
    setNotification({
      message: 'Data updated successfully',
      severity: 'success',
    });
  };

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const confirmSave = async () => {
    setIsSaving(true);
    setShowSaveDialog(false);

    try {
      // Validate data before saving
      if (data.length === 0) {
        throw new Error('No data to save');
      }

      // Check for empty required fields (you can customize this validation)
      const hasEmptyRequiredFields = data.some(row =>
        headers.some(header => {
          const value = row[header];
          return value === undefined || value === null || String(value).trim() === '';
        })
      );

      if (hasEmptyRequiredFields) {
        setNotification({
          message: 'Warning: Some cells are empty. Consider filling them before saving.',
          severity: 'warning',
        });
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Convert to CSV and download
      const csvContent = convertToCSV(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `updated_data_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setNotification({
        message: `Successfully saved ${data.length} rows to CSV file!`,
        severity: 'success',
      });
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error('Save error:', error);
      setNotification({
        message: `Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelSave = () => {
    setShowSaveDialog(false);
  };

  const convertToCSV = (data: CSVRow[], headers: string[]): string => {
    if (data.length === 0) {
      return headers.join(',');
    }

    const csvHeaders = headers.join(',');
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header] || '';
        const stringValue = String(value);

        // Escape commas, quotes, and newlines in CSV values
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Keyboard shortcut for saving (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (data.length > 0 && !isSaving) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [data.length, isSaving]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          CSV Data Manager
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <FileUpload onDataLoad={handleDataLoad} />
        </Paper>

        {data.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <CSVDataTable
              data={data}
              headers={headers}
              onDataUpdate={handleDataUpdate}
              onSave={handleSave}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </Paper>
        )}
      </Box>

      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveDialog} onClose={cancelSave} maxWidth="sm" fullWidth>
        <DialogTitle>Save Data to CSV</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Save Summary
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography>
              • Total rows: {data.length}
            </Typography>
            <Typography>
              • Columns: {headers.length} ({headers.join(', ')})
            </Typography>
            <Typography>
              • File format: CSV (Comma Separated Values)
            </Typography>
            <Typography>
              • Encoding: UTF-8
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            This will download a file named "updated_data_YYYY-MM-DD.csv" to your computer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelSave} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={confirmSave}
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} /> : null}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {notification && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
}

export default App; 