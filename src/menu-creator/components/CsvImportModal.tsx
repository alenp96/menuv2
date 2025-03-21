import React, { useState, useRef } from 'react';
import { useAction } from 'wasp/client/operations';
import { importMenuFromCsv } from 'wasp/client/operations';
import Papa from 'papaparse';
import type { CsvMenuItem } from '../types';

type CsvImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMenuAction = useAction(importMenuFromCsv);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const validateCsvData = (data: any[]) => {
    if (!data || data.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Check if required headers are present
    const requiredHeaders = ['section_name', 'item_name', 'price'];
    const headers = Object.keys(data[0]);
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Validate each row
    data.forEach((row, index) => {
      if (!row.section_name) {
        throw new Error(`Row ${index + 1}: Missing section name`);
      }
      if (!row.item_name) {
        throw new Error(`Row ${index + 1}: Missing item name`);
      }
      
      // Handle price value conversion more flexibly
      if (row.price === undefined || row.price === null || row.price === '') {
        throw new Error(`Row ${index + 1}: Price must be provided`);
      }
      
      // Clean and parse the price value
      try {
        // Remove any non-numeric characters except for decimal point
        const cleanedPrice = String(row.price).replace(/[^\d.]/g, '');
        const parsedPrice = parseFloat(cleanedPrice);
        
        if (isNaN(parsedPrice)) {
          throw new Error(`Row ${index + 1}: Price "${row.price}" is not a valid number`);
        }
        
        // Update the price with the cleaned value
        row.price = parsedPrice;
      } catch (error) {
        throw new Error(`Row ${index + 1}: Price "${row.price}" could not be parsed as a number`);
      }
      
      // Sanitize empty fields to null
      if (row.description === undefined || row.description === '') {
        row.description = null;
      }
      if (row.dietary_tags === undefined || row.dietary_tags === '') {
        row.dietary_tags = null;
      }
      if (row.allergens === undefined || row.allergens === '') {
        row.allergens = null;
      }
    });

    return true;
  };

  // Helper function to try parsing with different delimiters if auto-detection fails
  const parseWithFallbacks = async (file: File): Promise<any[]> => {
    // First try with auto-detection
    try {
      return await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          delimiter: '',  // Auto-detect
          quoteChar: '"', // Use double quotes for quoted fields
          escapeChar: '"', // Use double quotes for escaping quotes
          transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
          dynamicTyping: false, // Keep everything as strings for consistent processing
          comments: false, // Don't treat any lines as comments
          complete: (results) => {
            console.log("Parse results:", results);
            
            if (results.errors && results.errors.length > 0) {
              console.warn("CSV parsing warnings/errors:", results.errors);
              
              // If the errors are just warnings about quotes, we can still proceed
              const fatalErrors = results.errors.filter(e => 
                !e.message.includes('Quotes') && 
                !e.message.includes('delimiter') &&
                !e.message.includes('Trailing') &&
                e.type === 'Quotes'
              );
              
              if (fatalErrors.length === 0 && results.data && results.data.length > 0) {
                try {
                  // Clean the data before validation
                  const cleanedData = results.data.map((row: any) => {
                    // Clean up each field and handle empty values
                    Object.keys(row).forEach(key => {
                      if (row[key] === undefined || row[key] === '') {
                        row[key] = null;
                      } else if (typeof row[key] === 'string') {
                        row[key] = row[key].trim();
                      }
                    });
                    return row;
                  });
                  
                  validateCsvData(cleanedData);
                  resolve(cleanedData);
                } catch (error) {
                  reject(error);
                }
              } else if (results.errors[0].message.includes('delimiting character')) {
                reject(new Error("Auto-detection failed"));
              } else {
                reject(new Error(`CSV parsing errors: ${results.errors[0].message}`));
              }
            } else {
              try {
                // Clean the data before validation
                const cleanedData = results.data.map((row: any) => {
                  // Clean up each field and handle empty values
                  Object.keys(row).forEach(key => {
                    if (row[key] === undefined || row[key] === '') {
                      row[key] = null;
                    } else if (typeof row[key] === 'string') {
                      row[key] = row[key].trim();
                    }
                  });
                  return row;
                });
                
                validateCsvData(cleanedData);
                resolve(cleanedData);
              } catch (error: any) {
                reject(error);
              }
            }
          },
          error: (error) => reject(error)
        });
      });
    } catch (initialError) {
      console.error("Initial parsing failed:", initialError);
      
      // Try explicit parsing with specific configuration for complex CSV
      try {
        return await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',',
            quoteChar: '"',
            escapeChar: '"',
            transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
            dynamicTyping: false,
            comments: false,
            // Special handling for malformed quoted fields
            step: function(results, parser) {
              console.log("Row:", results.data);
            },
            complete: (results) => {
              if (results.errors && results.errors.length > 0) {
                console.warn("Second-attempt CSV parsing warnings:", results.errors);
              }
              
              if (results.data && results.data.length > 0) {
                try {
                  // Clean and fix the data before validation
                  const cleanedData = results.data
                    .filter((row: any) => row && Object.keys(row).length > 0) // Remove empty rows
                    .map((row: any) => {
                      // Handle each field
                      Object.keys(row).forEach(key => {
                        if (row[key] === undefined || row[key] === '') {
                          row[key] = null;
                        } else if (typeof row[key] === 'string') {
                          row[key] = row[key].trim();
                        }
                      });
                      return row;
                    });
                  
                  validateCsvData(cleanedData);
                  resolve(cleanedData);
                } catch (error) {
                  reject(error);
                }
              } else {
                reject(new Error("Could not parse any valid rows from the CSV file"));
              }
            },
            error: (error) => reject(error)
          });
        });
      } catch (error) {
        console.error("Second attempt failed:", error);
        
        // Last-ditch effort: try to manually parse the file content
        try {
          const text = await file.text();
          const rows = text.split(/\r?\n/).filter(line => line.trim());
          
          if (rows.length <= 1) {
            throw new Error("CSV file doesn't contain enough rows");
          }
          
          const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
          const requiredHeaders = ['section_name', 'item_name', 'price'];
          
          for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
              throw new Error(`Missing required column: ${required}`);
            }
          }
          
          // Process data rows
          const parsedData: any[] = [];
          for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            
            // Handle quoted values with commas
            const rowData: any = {};
            let row = rows[i];
            let values: string[] = [];
            let inQuote = false;
            let currentValue = "";
            
            for (let j = 0; j < row.length; j++) {
              const char = row[j];
              
              if (char === '"') {
                inQuote = !inQuote;
              } else if (char === ',' && !inQuote) {
                values.push(currentValue.trim());
                currentValue = "";
              } else {
                currentValue += char;
              }
            }
            
            // Add the last value
            values.push(currentValue.trim());
            
            // Map to object with headers
            for (let j = 0; j < headers.length; j++) {
              const value = j < values.length ? values[j] : null;
              rowData[headers[j]] = value === "" ? null : value;
            }
            
            // Make sure required fields are present
            if (!rowData.section_name || !rowData.item_name || !rowData.price) {
              console.warn(`Skipping invalid row ${i+1}:`, rowData);
              continue;
            }
            
            parsedData.push(rowData);
          }
          
          if (parsedData.length === 0) {
            throw new Error("Could not parse any valid rows from the CSV");
          }
          
          validateCsvData(parsedData);
          return parsedData;
        } catch (finalError) {
          console.error("Final manual parsing attempt failed:", finalError);
          throw new Error(
            "Could not parse the CSV file. Please ensure it follows the required format and try again. " + 
            (finalError instanceof Error ? finalError.message : "")
          );
        }
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, try to read the file as text to do basic format checking
      const text = await file.text();
      const firstLine = text.split(/\r?\n/)[0] || '';
      
      // Check if the first line contains the required headers
      const expectedHeaders = ['section_name', 'item_name', 'price'];
      const headerMissing = expectedHeaders.some(header => 
        !firstLine.toLowerCase().includes(header.toLowerCase())
      );
      
      if (headerMissing) {
        throw new Error(
          'CSV file missing required headers. The first line must include "section_name", "item_name", and "price". ' +
          'Please download the sample template for the correct format.'
        );
      }
      
      // Use our parseWithFallbacks function for full parsing
      const result = await parseWithFallbacks(file);
      
      console.log('CSV data parsed successfully:', result);
      
      // Log the first row to help debug
      if (result && result.length > 0) {
        console.log('First row sample:', result[0]);
      }
      
      const importedMenu = await importMenuAction({ csvData: result });
      console.log('Menu imported successfully:', importedMenu);
      
      setIsLoading(false);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error during import:', error);
      setIsLoading(false);
      
      // Provide more helpful error messages based on common issues
      if (error.message?.includes('missing section_name')) {
        setError('Some rows are missing a section name. Every item must have a section name.');
      } else if (error.message?.includes('missing item_name')) {
        setError('Some rows are missing an item name. Every item must have a name.');
      } else if (error.message?.includes('invalid price')) {
        setError('Some rows have invalid price values. Prices must be numbers (e.g., 8.99).');
      } else if (error.message?.includes('Missing required columns')) {
        setError(
          'CSV file is missing required columns. Please make sure your CSV has section_name, item_name, and price columns.'
        );
      } else {
        setError(error.message || 'An error occurred while importing the menu');
      }
    }
  };

  const resetForm = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to create and download a sample CSV template
  const downloadSampleCsv = () => {
    const csvContent = 'section_name,item_name,price,description,dietary_tags,allergens\r\n' +
      'Starters,Caesar Salad,8.99,"Fresh romaine lettuce with croutons and parmesan",Vegetarian,Dairy\r\n' +
      'Starters,Garlic Bread,5.50,"Toasted bread with garlic butter",,Gluten\r\n' +
      'Main Course,Grilled Salmon,18.99,"Atlantic salmon with seasonal vegetables",Gluten-Free,Fish\r\n' +
      'Specialty Coffee,Espresso,2.0,,,\r\n' +
      'Desserts,Chocolate Cake,6.99,"Rich chocolate cake with ganache",Vegetarian,Dairy';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'menu_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Import Menu from CSV</h2>
          <button 
            onClick={() => { onClose(); resetForm(); }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">CSV File Format Instructions</h3>
          <p className="mb-2">Your CSV file must include the following columns:</p>
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>section_name</strong> - Name of the menu section</li>
              <li><strong>item_name</strong> - Name of the menu item</li>
              <li><strong>price</strong> - Price of the item (numeric value only)</li>
              <li><strong>description</strong> (optional) - Description of the item</li>
              <li><strong>dietary_tags</strong> (optional) - Comma-separated list of dietary tags (e.g. "Vegan,Gluten-Free")</li>
              <li><strong>allergens</strong> (optional) - Comma-separated list of allergens (e.g. "Nuts,Dairy")</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-1">Example CSV format:</h4>
            <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
              <pre className="text-xs">
{`section_name,item_name,price,description,dietary_tags,allergens
Starters,Caesar Salad,8.99,"Fresh romaine lettuce with croutons and parmesan",Vegetarian,Dairy
Starters,Garlic Bread,5.50,"Toasted bread with garlic butter",,Gluten
Main Course,Grilled Salmon,18.99,"Atlantic salmon with seasonal vegetables",Gluten-Free,Fish
Specialty Coffee,Espresso,2.0,,,
Desserts,Chocolate Cake,6.99,"Rich chocolate cake with ganache",Vegetarian,Dairy`}
              </pre>
            </div>
          </div>

          <div className="mb-4 bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <h4 className="font-medium mb-1 text-yellow-800">Important CSV Guidelines:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-700">
              <li>Only <strong>section_name</strong>, <strong>item_name</strong>, and <strong>price</strong> are required</li>
              <li>For optional fields (description, dietary_tags, allergens), you can leave them empty</li>
              <li>Include all column headers even if some rows don't use all optional fields</li>
              <li>Save your file as a standard CSV using comma (,) as the delimiter</li>
              <li>Make sure your spreadsheet application exports with the correct encoding (UTF-8 recommended)</li>
              <li>If your text contains commas, ensure they are properly quoted in the CSV</li>
              <li>Excel users: Use "Save As" and select CSV format (Comma delimited)</li>
            </ul>
          </div>

          <button 
            onClick={() => downloadSampleCsv()}
            className="mb-4 text-sm text-primary hover:text-primary-dark underline flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Sample CSV Template
          </button>

          <p className="mb-2 text-sm text-gray-600">
            <strong>Note:</strong> Items with the same section name will be grouped together in the same section.
            Items will be added in the order they appear in the CSV.
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700">
            Select CSV File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="csv-file"
            accept=".csv"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-500">
              Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => { onClose(); resetForm(); }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isLoading || !file}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? 'Importing...' : 'Import Menu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal; 