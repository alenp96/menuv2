import React, { useState, useEffect } from 'react';
import { useAction } from 'wasp/client/operations';
import { updateMenu } from 'wasp/client/operations';
import { Menu, AVAILABLE_CURRENCIES } from '../types';

interface MenuDetailsFormProps {
  menu: Menu;
  onMenuUpdated: () => void;
}

export const MenuDetailsForm: React.FC<MenuDetailsFormProps> = ({ menu, onMenuUpdated }) => {
  const [name, setName] = useState(menu.name);
  const [description, setDescription] = useState(menu.description || '');
  const [publicUrl, setPublicUrl] = useState(menu.publicUrl);
  const [selectedCurrency, setSelectedCurrency] = useState(menu.currencyCode || 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateMenuFn = useAction(updateMenu);

  useEffect(() => {
    setHasUnsavedChanges(
      name !== menu.name ||
      description !== (menu.description || '') ||
      publicUrl !== menu.publicUrl ||
      selectedCurrency !== menu.currencyCode
    );
  }, [name, description, publicUrl, selectedCurrency, menu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const currency = AVAILABLE_CURRENCIES.find(c => c.code === selectedCurrency);
      if (!currency) throw new Error('Invalid currency selected');

      const finalPublicUrl = publicUrl.trim() || name.toLowerCase().replace(/\s+/g, '-');
      await updateMenuFn({
        menuId: menu.id,
        name,
        description: description || '',
        publicUrl: finalPublicUrl,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
        currencyPosition: currency.position
      });
      setPublicUrl(finalPublicUrl);
      setHasUnsavedChanges(false);
      onMenuUpdated();
    } catch (error) {
      console.error('Failed to update menu:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
              {currency.code} ({currency.symbol}) - {currency.position === 'prefix' ? `${currency.symbol}1.00` : `1.00${currency.symbol}`}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500">
          Select the currency for displaying prices in your menu.
        </p>
      </div>

      <div>
        <label htmlFor="publicUrl" className="block text-sm font-medium text-gray-700">
          Public URL
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
            menu/
          </span>
          <input
            type="text"
            id="publicUrl"
            value={publicUrl}
            onChange={(e) => setPublicUrl(e.target.value)}
            className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
            placeholder="your-menu-url"
            disabled={isSaving}
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          This is the URL where your menu will be publicly accessible.
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          disabled={!hasUnsavedChanges || isSaving}
          className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm ${
            hasUnsavedChanges && !isSaving
              ? 'bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}; 