import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

type ImageCropperProps = {
  file: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
};

// Function to get a centered crop with the specified aspect ratio
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

// This function generates a cropped image blob from the crop selection
const getCroppedImage = async (
  imageRef: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const scaleX = imageRef.naturalWidth / imageRef.width;
  const scaleY = imageRef.naturalHeight / imageRef.height;
  
  // Increase output resolution by using a multiplier
  const pixelRatio = window.devicePixelRatio || 1;
  const scaleMultiplier = Math.max(pixelRatio, 2); // At least 2x for better quality
  
  canvas.width = crop.width * scaleMultiplier;
  canvas.height = crop.height * scaleMultiplier;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }
  
  // Apply smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    imageRef,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 1.0); // Max quality
  });
};

export const ImageCropper: React.FC<ImageCropperProps> = ({
  file,
  onCropComplete,
  onCancel,
  aspectRatio = 3/4,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Create a preview URL when the file changes
  React.useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspectRatio) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  };

  const handleCropComplete = async () => {
    if (!imageRef.current || !completedCrop) return;
    
    setIsLoading(true);
    try {
      const croppedImage = await getCroppedImage(imageRef.current, completedCrop);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Error creating cropped image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Crop Image (3:4 Ratio)</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-auto">
          <div className="flex justify-center">
            {imageUrl && (
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-h-[70vh] border"
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Image to crop"
                  onLoad={onImageLoad}
                  className="max-w-full"
                />
              </ReactCrop>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p className="mb-2"><strong>Instructions:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Drag the corners to adjust the crop area</li>
              <li>The image will maintain a 3:4 ratio (portrait format) for optimal display</li>
              <li>For best results, center the main subject of your food item</li>
              <li>You can drag the entire selection to reposition it</li>
            </ul>
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-amber-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Images will be cropped at high quality for the best presentation on your menu
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleCropComplete}
            className="px-4 py-2 text-white bg-amber-500 rounded-md hover:bg-amber-600 transition-colors"
            disabled={isLoading || !completedCrop}
          >
            {isLoading ? 'Processing...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
}; 