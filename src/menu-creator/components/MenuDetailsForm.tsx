import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAction } from 'wasp/client/operations';
import { updateMenu } from 'wasp/client/operations';
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

  const updateMenuFn = useAction(updateMenu);

  // Use useMemo to avoid recalculating this check on every render
  const hasChanges = useMemo(() => {
    return name !== menu.name ||
      description !== (menu.description || '') ||
      publicUrl !== menu.publicUrl ||
      selectedCurrency !== menu.currencyCode;
  }, [name, description, publicUrl, selectedCurrency, menu]);

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
        template: 'default'
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
    menu.id, 
    updateMenuFn, 
    onMenuUpdated
  ]);

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