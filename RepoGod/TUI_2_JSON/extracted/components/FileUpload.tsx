import React, { useCallback, useState } from 'react';
import { Upload, FileImage, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (base64: string) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    
    // Basic type check
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc).');
      return;
    }

    // Increased limit to 50MB to accommodate large screenshots
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('File size must be less than 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      onFileSelect(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative group w-full h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-900 border-zinc-700' : ''}
          ${dragActive ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={!disabled ? handleDrop : undefined}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleChange}
          accept="image/*"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-4 text-center p-6">
          <div className={`p-4 rounded-full ${dragActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-400'}`}>
            {dragActive ? <FileImage size={32} /> : <Upload size={32} />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-200">
              {dragActive ? "Drop the TUI screenshot here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-zinc-500">
              PNG, JPG or WEBP (max 50MB)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;