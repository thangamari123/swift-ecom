import { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
}

export function ImageUploader({ value, onChange, folder, label = 'Upload Image' }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, WEBP, and AVIF are allowed.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return false;
    }
    return true;
  };

  const uploadFile = (file: File) => {
    if (!validateFile(file)) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset || cloudName === 'your_cloud_name') {
      toast.error('Cloudinary configuration is missing in environment variables.');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        onChange(response.secure_url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      toast.error('Network error during upload.');
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    xhr.send(formData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
      // Reset input value to allow uploading the same file again if needed
      e.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-slate-900 mb-2">{label}</label>}
      
      {value ? (
        <div className="relative rounded-xl border border-slate-200 overflow-hidden group bg-slate-50 flex items-center justify-center p-2">
          <img 
            src={value} 
            alt="Uploaded preview" 
            className="w-full h-auto max-h-48 object-contain rounded-lg" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-xl">
            <button
              type="button"
              onClick={triggerFileInput}
              className="bg-white text-slate-900 text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!isUploading ? triggerFileInput : undefined}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-[#e0e7ff] bg-[#f8faff] hover:bg-[#f0f4ff] cursor-pointer'
          } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center w-full">
              <Loader2 className="w-8 h-8 text-indigo-600 mb-3 animate-spin" />
              <p className="text-sm font-bold text-slate-900 mb-2">Uploading... {progress}%</p>
              <div className="w-full max-w-[200px] h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? 'text-indigo-600' : 'text-[#4F46E5]'}`} />
              <p className="text-sm font-bold text-slate-900 mb-1">
                {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
              </p>
              <p className="text-xs text-slate-500 font-medium">(JPG, PNG, WEBP, AVIF, Max. 5MB)</p>
            </>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp, image/avif"
        className="hidden"
      />
    </div>
  );
}
