import React from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';

/**
 * Excel / PDF export pair used by every report.
 * onExport(format) receives 'xlsx' or 'pdf'.
 */
const ExportButtons = ({ onExport, exporting = null, disabled = false }) => (
  <div className="inline-flex rounded-lg border-2 border-gray-300 bg-white overflow-hidden shadow-sm">
    <button
      type="button"
      onClick={() => onExport('xlsx')}
      disabled={disabled || !!exporting}
      className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
      title="Download as Excel"
    >
      {exporting === 'xlsx' ? <ArrowDownTrayIcon className="h-4 w-4 animate-bounce" /> : <TableCellsIcon className="h-4 w-4 text-green-600" />}
      Excel
    </button>
    <span className="w-px bg-gray-300" />
    <button
      type="button"
      onClick={() => onExport('pdf')}
      disabled={disabled || !!exporting}
      className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
      title="Download as PDF"
    >
      {exporting === 'pdf' ? <ArrowDownTrayIcon className="h-4 w-4 animate-bounce" /> : <DocumentTextIcon className="h-4 w-4 text-red-600" />}
      PDF
    </button>
  </div>
);

export default ExportButtons;
