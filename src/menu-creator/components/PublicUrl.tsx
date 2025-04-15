import React, { useState, useRef } from 'react';
import { Menu } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface PublicUrlProps {
  menu: Menu;
}

const PublicUrl: React.FC<PublicUrlProps> = ({ menu }) => {
  const [showQrCode, setShowQrCode] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  if (!menu.isPublished || !menu.publicUrl) return null;

  const publicMenuUrl = `${window.location.origin}/menu/${menu.publicUrl}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicMenuUrl);
    alert('URL copied to clipboard!');
  };

  const handleDownloadQrCode = () => {
    if (!qrCodeRef.current) return;
    
    const svgElement = qrCodeRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // Create a canvas element to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Set canvas size to match QR code size (with some padding)
    canvas.width = 1024;
    canvas.height = 1024;
    
    // Convert SVG to string
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      if (!ctx) return;
      
      // Fill background white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image centered with padding
      const padding = 100;
      ctx.drawImage(img, padding, padding, canvas.width - (padding * 2), canvas.height - (padding * 2));
      
      // Add menu name at the bottom
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText(menu.name, canvas.width / 2, canvas.height - 40);
      
      // Convert to PNG and download
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `${menu.name.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
      downloadLink.click();
      
      // Cleanup
      URL.revokeObjectURL(svgUrl);
    };
    
    img.src = svgUrl;
  };
  
  const handleShareQrCode = async () => {
    if (!qrCodeRef.current || typeof navigator === 'undefined' || !('share' in navigator)) return;
    
    try {
      const svgElement = qrCodeRef.current.querySelector('svg');
      if (!svgElement) return;
      
      // Convert SVG to Blob
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      
      // Create a File from the Blob
      const file = new File([svgBlob], `${menu.name.replace(/\s+/g, '-').toLowerCase()}-qr-code.svg`, { 
        type: 'image/svg+xml' 
      });
      
      // Check if the browser supports sharing files
      const shareData: { 
        title: string;
        text: string;
        url: string;
        files?: File[];
      } = {
        title: `${menu.name} Menu QR Code`,
        text: `Scan this QR code to view the menu for ${menu.name}`,
        url: publicMenuUrl
      };
      
      // Only add files if the browser supports sharing files
      if ('canShare' in navigator && navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      }
      
      await navigator.share(shareData);
    } catch (error) {
      console.error('Error sharing QR code:', error);
      // Fallback to just sharing the URL
      try {
        await navigator.share({
          title: `${menu.name} Menu`,
          text: `View the menu for ${menu.name}`,
          url: publicMenuUrl
        });
      } catch (fallbackError) {
        console.error('Error sharing URL:', fallbackError);
        alert('Unable to share. You can download the QR code instead.');
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-800">Public Menu URL</h2>
      </div>
      <div className="flex items-center flex-wrap md:flex-nowrap gap-2 mb-4">
        <div className="relative flex-grow">
          <input
            type="text"
            value={publicMenuUrl}
            readOnly
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 pr-10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        </div>
        <button
          onClick={handleCopyUrl}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 hover:shadow-md transition-all duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copy URL
        </button>
        <a 
          href={`/menu/${menu.publicUrl}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Menu
        </a>
        <button
          onClick={() => setShowQrCode(!showQrCode)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          {showQrCode ? 'Hide QR Code' : 'Show QR Code'}
        </button>
      </div>
      
      {showQrCode && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Menu QR Code</h3>
          <div className="flex flex-col items-center">
            <div 
              ref={qrCodeRef}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
            >
              <QRCodeSVG 
                value={publicMenuUrl}
                size={200}
                bgColor={'#FFFFFF'}
                fgColor={'#000000'}
                level={'H'}
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2 mb-4">
              Scan this code to view the menu on any device
            </p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={handleDownloadQrCode}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md transition-all duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR Code
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleShareQrCode}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow transition-all duration-200 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicUrl; 