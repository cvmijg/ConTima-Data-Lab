import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesSelected, onRemoveFile, disabled }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors 
        ${disabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-white border-blue-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer group'}`}
      >
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-full group-hover:bg-blue-200 transition-colors">
            <Upload size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-700">
              Upload Analytics Files
            </h3>
            <p className="text-sm text-slate-500">
              Drag & drop CSV files here, or click to select
            </p>
            <p className="text-xs text-slate-400">
              Supports multiple files (Performance, Revenue, Retention)
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Selected Files ({files.length})
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {files.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                {!disabled && (
                  <button 
                    onClick={() => onRemoveFile(idx)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;