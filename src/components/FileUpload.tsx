import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import { Upload as UploadIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import Papa from 'papaparse';
import { CSVRow } from '../types/csv';

interface FileUploadProps {
  onDataLoad: (data: CSVRow[], headers: string[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const parseCSV = (file: File) => {
    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsLoading(false);
        if (results.errors.length > 0) {
          setError('Error parsing CSV file. Please check the file format.');
          return;
        }

        if (results.data.length === 0) {
          setError('CSV file is empty or has no valid data.');
          return;
        }

        const headers = results.meta.fields || [];
        const data = results.data as CSVRow[];

        onDataLoad(data, headers);
      },
      error: (error: any) => {
        setIsLoading(false);
        setError(`Error reading file: ${error.message}`);
      },
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }

    parseCSV(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Please drop a valid CSV file');
        return;
      }
      parseCSV(file);
    }
  };

  const handleSampleData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/sample-data.csv');
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsLoading(false);
          if (results.errors.length > 0) {
            setError('Error parsing sample CSV file.');
            return;
          }

          const headers = results.meta.fields || [];
          const data = results.data as CSVRow[];

          onDataLoad(data, headers);
        },
        error: (error: any) => {
          setIsLoading(false);
          setError(`Error reading sample file: ${error.message}`);
        },
      });
    } catch (error: unknown) {
      setIsLoading(false);
      setError('Failed to load sample data. Please try uploading your own CSV file.');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}>
        Upload CSV File
      </Typography>

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Upload Column */}
        <Box sx={{ flex: 1 }}>
          <Paper
            sx={{
              p: 4,
              border: `2px dashed ${isDragOver ? 'primary.main' : '#e0e0e0'}`,
              borderRadius: 2,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: isDragOver ? 'action.hover' : 'background.paper',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
            onClick={handleUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadIcon
              sx={{
                fontSize: 64,
                color: isDragOver ? 'primary.main' : 'text.secondary',
                mb: 2,
                transition: 'color 0.3s ease'
              }}
            />
            <Typography variant="h6" color="text.primary" gutterBottom>
              {isDragOver ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              or click to browse files
            </Typography>

            <Button
              variant="contained"
              size="large"
              sx={{ mt: 3, px: 4, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Choose File'}
            </Button>
          </Paper>
        </Box>

        {/* Sample Data Column */}
        <Box sx={{ flex: 1 }}>
          <Paper
            sx={{
              p: 4,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              textAlign: 'center',
              backgroundColor: 'grey.50',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <DownloadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" color="text.primary" gutterBottom>
              Try with Sample Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Load a sample CSV file to see how the application works
            </Typography>
            <Button
              variant="outlined"
              size="large"
              onClick={handleSampleData}
              disabled={isLoading}
              startIcon={<DownloadIcon />}
              sx={{ px: 4, py: 1.5 }}
            >
              {isLoading ? 'Loading Sample...' : 'Load Sample Data'}
            </Button>
          </Paper>
        </Box>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload; 