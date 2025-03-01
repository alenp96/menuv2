import React, { useState, useRef } from 'react';
import axios from 'axios';
import { getMenuItemImageUploadUrl, updateMenuItem } from 'wasp/client/operations';
import { ALLOWED_IMAGE_TYPES } from '../menuItemImageUtils';

type MenuItemImageUploadProps = {
  itemId: string;
  currentImageUrl: string | null;
  onImageUploaded: () => void;
};

export const MenuItemImageUpload: React.FC<MenuItemImageUploadProps> = ({ 
  itemId, 
  currentImageUrl, 
  onImageUploaded 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      console.log('Getting upload URL for item:', itemId);
      
      // Get the upload URL
      const { uploadUrl, publicUrl } = await getMenuItemImageUploadUrl({ 
        itemId, 
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

      // Update the menu item with the new image URL
      console.log('Updating menu item with new image URL:', publicUrl);
      await updateMenuItem({ 
        itemId, 
        name: undefined, 
        description: undefined, 
        price: undefined, 
        imageUrl: publicUrl 
      });

      console.log('Menu item updated successfully');
      
      // Notify parent component
      onImageUploaded();
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

  const handleDeleteImage = async () => {
    if (!currentImageUrl) return;
    
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      console.log('Removing image for item:', itemId);
      
      // Update the menu item to remove the image URL
      await updateMenuItem({ 
        itemId, 
        imageUrl: ''
      });
      
      console.log('Image reference removed successfully');
      
      // Note: This doesn't actually delete the file from S3, it just removes the reference
      // The file will remain in S3 but will no longer be associated with this menu item
      
      onImageUploaded();
    } catch (err) {
      console.error('Error removing image reference:', err);
      setError('Failed to remove image. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-4">
        {currentImageUrl && (
          <div className="relative w-16 h-16 rounded-md overflow-hidden">
            <img 
              src={currentImageUrl} 
              alt="Menu item" 
              className="w-full h-full object-cover"
              onLoad={() => console.log('Thumbnail image loaded successfully:', currentImageUrl)}
              onError={(e) => {
                console.error('Thumbnail image failed to load:', currentImageUrl);
                // Try with a different URL format
                const imgElement = e.currentTarget;
                const originalSrc = imgElement.src;
                
                // If this is the first error, try changing the URL format
                if (originalSrc === currentImageUrl) {
                  console.log('Trying alternative URL format for thumbnail...');
                  // Try a different URL format (without the region in the domain)
                  const altUrl = currentImageUrl.replace(
                    /https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.*)/,
                    'https://$1.s3.amazonaws.com/$3'
                  );
                  if (altUrl !== originalSrc) {
                    console.log('Using alternative URL for thumbnail:', altUrl);
                    imgElement.src = altUrl;
                    return;
                  }
                }
                
                // If we've already tried an alternative or no alternative is available, use a placeholder
                imgElement.src = 'https://via.placeholder.com/150?text=Image+Error';
                console.log('Using placeholder image for thumbnail');
              }}
            />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex space-x-2">
            <label 
              htmlFor={`image-upload-${itemId}`}
              className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {currentImageUrl ? 'Change Image' : 'Add Image'}
            </label>
            <input
              id={`image-upload-${itemId}`}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              className="sr-only"
              onChange={handleFileChange}
              disabled={isUploading || isDeleting}
              ref={fileInputRef}
            />
            
            {currentImageUrl && (
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={isUploading || isDeleting}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-red-700 bg-white border border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {isDeleting ? 'Deleting...' : 'Delete Image'}
              </button>
            )}
          </div>
          
          {isUploading && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-amber-500 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
            </div>
          )}
          
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}; 