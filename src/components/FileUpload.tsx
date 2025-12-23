import { useRef, useState } from 'react';
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
      error: (error: Error) => {
        setIsLoading(false);
        setError(`Error reading file: ${error.message}`);
      },
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        error: (error: Error) => {
          setIsLoading(false);
          setError(`Error reading sample file: ${error.message}`);
        },
      });
    } catch {
      setIsLoading(false);
      setError('Failed to load sample data. Please try uploading your own CSV file.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold text-center text-gray-900 mb-8">
        Upload CSV File
      </h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Upload Column */}
        <div className="flex-1">
          <div
            onClick={handleUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              h-full min-h-[280px] p-8 rounded-xl border-2 border-dashed cursor-pointer
              flex flex-col items-center justify-center text-center
              transition-all duration-200
              ${isDragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 bg-white hover:border-primary-400 hover:bg-gray-50'
              }
            `}
          >
            <svg
              className={`w-16 h-16 mb-4 transition-colors ${isDragOver ? 'text-primary-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {isDragOver ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
            </h3>
            <p className="text-gray-500 mb-4">or click to browse files</p>
            <button
              type="button"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Processing...' : 'Choose File'}
            </button>
          </div>
        </div>

        {/* Sample Data Column */}
        <div className="flex-1">
          <div className="h-full min-h-[280px] p-8 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center">
            <svg
              className="w-16 h-16 mb-4 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Try with Sample Data
            </h3>
            <p className="text-gray-500 text-sm mb-2">
              Load a sample CSV file to see how the application works
            </p>
            <p className="text-gray-400 text-xs mb-4">
              Sample data from{' '}
              <a
                href="https://dummyfiles.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
                onClick={(e) => e.stopPropagation()}
              >
                dummyfiles.app
              </a>
            </p>
            <button
              type="button"
              onClick={handleSampleData}
              disabled={isLoading}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {isLoading ? 'Loading Sample...' : 'Load Sample Data'}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
