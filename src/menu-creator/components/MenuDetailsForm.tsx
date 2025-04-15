import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAction } from 'wasp/client/operations';
import { updateMenu, getMenuLogoUploadUrl } from 'wasp/client/operations';
import { Menu, AVAILABLE_CURRENCIES } from '../types';

interface MenuDetailsFormProps {
  menu: Menu;
  onMenuUpdated: () => void;
}

export const MenuDetailsForm: React.FC<MenuDetailsFormProps> = memo(({ menu, onMenuUpdated }) => {
  const [name, setName] = useState(menu.name);
  const [description, setDescription] = useState(menu.description || '');
  const [publicUrl, setPublicUrl] = useState(menu.publicUrl);
  const [selectedCurrency, setSelectedCurrency] = useState(menu.currencyCode || 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [logoUrl, setLogoUrl] = useState(menu.logoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const updateMenuFn = useAction(updateMenu);
  const getMenuLogoUploadUrlFn = useAction(getMenuLogoUploadUrl);

  // Use useMemo to avoid recalculating this check on every render
  const hasChanges = useMemo(() => {
    return name !== menu.name ||
      description !== (menu.description || '') ||
      publicUrl !== menu.publicUrl ||
      selectedCurrency !== menu.currencyCode ||
      logoUrl !== (menu.logoUrl || '');
  }, [name, description, publicUrl, selectedCurrency, logoUrl, menu]);

  useEffect(() => {
    setHasUnsavedChanges(hasChanges);
  }, [hasChanges]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const currency = AVAILABLE_CURRENCIES.find(c => c.code === selectedCurrency);
      if (!currency) throw new Error('Invalid currency selected');

      const finalPublicUrl = publicUrl.trim() || name.toLowerCase().replace(/\s+/g, '-');
      
      const updatedMenu = await updateMenuFn({
        menuId: menu.id,
        name,
        description: description || '',
        publicUrl: finalPublicUrl,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
        currencyPosition: currency.position,
        template: 'default',
        logoUrl
      });
      
      // Update local state
      setPublicUrl(finalPublicUrl);
      setHasUnsavedChanges(false);
      
      // Force menu reload
      onMenuUpdated();
    } catch (error) {
      console.error('Failed to update menu:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    name, 
    description, 
    publicUrl, 
    selectedCurrency, 
    logoUrl,
    menu.id, 
    updateMenuFn, 
    onMenuUpdated
  ]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, WEBP, or SVG)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should not exceed 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Get upload URL
      const { uploadUrl, publicUrl } = await getMenuLogoUploadUrlFn({
        menuId: menu.id,
        fileName: file.name,
        fileType: file.type
      });

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      // Update logo URL
      setLogoUrl(publicUrl);
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  }, [menu.id, getMenuLogoUploadUrlFn]);

  const removeLogo = useCallback(() => {
    setLogoUrl('');
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Menu Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          placeholder="Enter menu name"
          disabled={isSaving}
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Menu Logo
        </label>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {logoUrl ? (
              <div className="relative w-24 h-24 border rounded-md overflow-hidden bg-gray-100">
                <img 
                  src={logoUrl} 
                  alt="Menu Logo" 
                  className="w-full h-full object-contain" 
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/120?text=Logo+Error';
                  }}
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  title="Remove logo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <label
              htmlFor="logo-upload"
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium 
                ${isUploadingLogo ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
            >
              {isUploadingLogo ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Logo
                </>
              )}
            </label>
            <input
              id="logo-upload"
              name="logo-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleLogoUpload}
              disabled={isUploadingLogo}
            />
            <p className="mt-2 text-xs text-gray-500">
              Upload a logo for your menu. Recommended size: 200x200 pixels. Max size: 2MB.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          placeholder="Enter menu description"
          disabled={isSaving}
        />
        <p className="mt-2 text-sm text-gray-500">
          Brief description of your menu that will be displayed to customers.
        </p>
      </div>

      {/* Currency Selection */}
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
          Currency
        </label>
        <select
          id="currency"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          disabled={isSaving}
        >
          {AVAILABLE_CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} ({currency.symbol})
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500">
          Choose the currency for your menu prices.
        </p>
      </div>

      {/* URL Slug */}
      <div>
        <label htmlFor="publicUrl" className="block text-sm font-medium text-gray-700">
          Public URL Slug
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            menu/
          </span>
          <input
            type="text"
            id="publicUrl"
            value={publicUrl}
            onChange={(e) => setPublicUrl(e.target.value)}
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
            placeholder={name.toLowerCase().replace(/\s+/g, '-')}
            disabled={isSaving}
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Customize the slug for your menu's public URL. Leave blank to auto-generate from the menu name.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving || !hasUnsavedChanges}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-300 cursor-not-allowed'} 
            transition-colors duration-200 flex items-center`}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}); 