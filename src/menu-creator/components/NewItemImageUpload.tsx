import React, { useState, useRef } from 'react';
import axios from 'axios';
import { getMenuItemImageUploadUrl } from 'wasp/client/operations';
import { ALLOWED_IMAGE_TYPES } from '../menuItemImageUtils';

type NewItemImageUploadProps = {
  onImageSelected: (imageUrl: string) => void;
  onFileSelected: (file: File) => void;
};

export const NewItemImageUpload: React.FC<NewItemImageUploadProps> = ({ 
  onImageSelected,
  onFileSelected
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
      return;
    }

    // Validate file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Generate a temporary ID for the new item
      const tempId = 'new-' + Date.now();
      console.log('Generated temporary ID for new item:', tempId);
      
      // Get the upload URL using the temporary ID
      console.log('Getting upload URL for new item');
      const { uploadUrl, publicUrl } = await getMenuItemImageUploadUrl({ 
        itemId: tempId, 
        fileName: file.name, 
        fileType: file.type 
      });

      console.log('Received upload URL:', uploadUrl);
      console.log('Public URL will be:', publicUrl);

      // Upload the file to S3
      console.log('Uploading file to S3...');
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percentage);
            console.log(`Upload progress: ${percentage}%`);
          }
        },
      });
      
      console.log('File uploaded successfully to S3');
      console.log('Public URL will be:', publicUrl);
      
      // Test if the image is accessible
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        console.log('Image accessibility test result:', testResponse.status, testResponse.statusText);
        if (!testResponse.ok) {
          console.warn('Image might not be immediately accessible. Status:', testResponse.status);
        }
      } catch (testError) {
        console.warn('Error testing image accessibility:', testError);
      }

      // Pass the URL and file to the parent through the new callback names
      console.log('Notifying parent component with URL:', publicUrl);
      onImageSelected(publicUrl);
      onFileSelected(file);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center">
        <label 
          htmlFor="new-item-image-upload"
          className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          Add Image
        </label>
        <input
          id="new-item-image-upload"
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
        />
        
        {isUploading && (
          <div className="ml-3">
            <div className="w-24 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-amber-500 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}; 