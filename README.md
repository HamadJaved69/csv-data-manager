# CSV Data Manager

A React/TypeScript web application for managing CSV data with advanced features including inline editing, searching, sorting, and data visualization.

## Features

- 📁 **File Upload**: Drag and drop or click to upload CSV files
- 📊 **Data Table**: Clean, responsive table display with Material-UI components
- ✏️ **Inline Editing**: Click any cell to edit data directly in the table
- 🔍 **Search & Filter**: Real-time search across all columns
- 📈 **Sorting**: Click column headers to sort data
- 🎨 **Row Highlighting**: Automatic highlighting based on status/type columns
- ➕ **Add/Delete Rows**: Add new rows or delete existing ones
- 💾 **Export**: Save modified data back to CSV format
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Technical Stack

- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **PapaParse** for CSV parsing
- **Modern React Hooks** for state management

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Upload CSV File**: Click the upload area or drag a CSV file to load data
2. **View Data**: The data will be displayed in a clean, sortable table
3. **Edit Data**: Click any cell to edit its content
4. **Search**: Use the search box to filter results
5. **Sort**: Click column headers to sort data
6. **Add/Delete**: Use the "Add Row" button or delete icons to modify data
7. **Save**: Click "Save" to download the modified data as a CSV file

## Project Structure

```
src/
├── components/
│   ├── CSVDataTable.tsx    # Main data table component
│   └── FileUpload.tsx      # File upload component
├── types/
│   └── csv.ts             # TypeScript type definitions
├── App.tsx                # Main application component
└── index.tsx              # Application entry point
```

## Features in Detail

### Inline Editing
- Click any cell to enter edit mode
- Press Enter to save or Escape to cancel
- Click outside the cell to save changes

### Search Functionality
- Real-time filtering across all columns
- Case-insensitive search
- Updates results as you type

### Sorting
- Click column headers to sort
- Toggle between ascending and descending order
- Visual indicators show current sort state

### Row Highlighting
- Automatic highlighting based on status columns
- Green for "Active" or "Completed" status
- Yellow for "Pending" or "Inactive" status
- Red for "Error" or "Failed" status

### Data Management
- Add new rows with empty cells
- Delete existing rows
- All changes are tracked and can be saved

## Sample Data

The application includes a sample CSV file (`public/sample-data.csv`) with employee data for testing purposes.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Material-UI for consistent design
- Responsive design principles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License. 