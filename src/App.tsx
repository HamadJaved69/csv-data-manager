import { useState, useEffect } from 'react';
import CSVDataTable from './components/CSVDataTable';
import FileUpload from './components/FileUpload';
import { CSVRow } from './types/csv';

const features = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: 'Inline Editing',
    description: 'Edit cells directly in the table with double-click. Changes are tracked and can be saved.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    title: 'Filter & Sort',
    description: 'Quickly find data with powerful filtering and sort columns in ascending or descending order.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: 'Export to CSV',
    description: 'Download your edited data as a properly formatted CSV file with one click.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Privacy First',
    description: 'All processing happens in your browser. Your data never leaves your device.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Fast & Lightweight',
    description: 'No server uploads needed. Instant parsing and editing of CSV files.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Works Everywhere',
    description: 'Responsive design works on desktop, tablet, and mobile devices.',
  },
];

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
      if (data.length === 0) {
        throw new Error('No data to save');
      }

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

      await new Promise(resolve => setTimeout(resolve, 1000));

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

  const severityStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 mb-4">
            Free & Open Source
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            CSV Data Manager
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Upload, edit, and export CSV files directly in your browser.
            No signup required. Your data stays private.
          </p>
        </div>

        {/* File Upload Section */}
        <section aria-label="File upload" className="card p-6 mb-6">
          <FileUpload onDataLoad={handleDataLoad} />
        </section>

        {/* Data Table Section */}
        {data.length > 0 && (
          <section aria-label="Data table" className="card p-6 mb-6">
            <CSVDataTable
              data={data}
              headers={headers}
              onDataUpdate={handleDataUpdate}
              onSave={handleSave}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </section>
        )}

        {/* Features Section */}
        {data.length === 0 && (
          <section aria-label="Features" className="mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
              Everything you need to manage CSV data
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="card p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="text-primary-600 mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-16 py-6 text-center border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            CSV Data Manager - Free online CSV editor. All processing happens locally in your browser.
          </p>
        </footer>
      </div>

      {/* Save Confirmation Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={cancelSave} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Save Data to CSV</h2>
              <div className="space-y-2 mb-6">
                <h3 className="font-medium text-gray-900">Save Summary</h3>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Total rows: {data.length}</li>
                  <li>• Columns: {headers.length} ({headers.join(', ')})</li>
                  <li>• File format: CSV (Comma Separated Values)</li>
                  <li>• Encoding: UTF-8</li>
                </ul>
                <p className="text-gray-500 text-sm mt-4">
                  This will download a file named "updated_data_YYYY-MM-DD.csv" to your computer.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelSave}
                  disabled={isSaving}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={isSaving}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {isSaving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${severityStyles[notification.severity]}`}>
            <span>{notification.message}</span>
            <button
              onClick={handleCloseNotification}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
