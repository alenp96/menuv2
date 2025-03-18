import React, { useState, useEffect } from 'react';
import { useAction } from 'wasp/client/operations';
import { updateMenu } from 'wasp/client/operations';
import { Menu, AVAILABLE_CURRENCIES, AVAILABLE_TEMPLATES, MenuTemplate } from '../types';

interface MenuDetailsFormProps {
  menu: Menu;
  onMenuUpdated: () => void;
}

export const MenuDetailsForm: React.FC<MenuDetailsFormProps> = ({ menu, onMenuUpdated }) => {
  const [name, setName] = useState(menu.name);
  const [description, setDescription] = useState(menu.description || '');
  const [publicUrl, setPublicUrl] = useState(menu.publicUrl);
  const [selectedCurrency, setSelectedCurrency] = useState(menu.currencyCode || 'USD');
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate>(menu.template || 'default');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateMenuFn = useAction(updateMenu);

  useEffect(() => {
    setHasUnsavedChanges(
      name !== menu.name ||
      description !== (menu.description || '') ||
      publicUrl !== menu.publicUrl ||
      selectedCurrency !== menu.currencyCode ||
      selectedTemplate !== menu.template
    );
  }, [name, description, publicUrl, selectedCurrency, selectedTemplate, menu]);

  useEffect(() => {
    // Try to load saved template from localStorage
    const savedTemplate = localStorage.getItem(`menu_template_${menu.id}`);
    if (savedTemplate && (savedTemplate === 'default' || savedTemplate === 'no-images')) {
      setSelectedTemplate(savedTemplate as MenuTemplate);
    }
  }, [menu.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const currency = AVAILABLE_CURRENCIES.find(c => c.code === selectedCurrency);
      if (!currency) throw new Error('Invalid currency selected');

      const finalPublicUrl = publicUrl.trim() || name.toLowerCase().replace(/\s+/g, '-');
      
      // Log the template value being saved
      console.log('Saving template:', selectedTemplate);
      
      // Save template to localStorage
      localStorage.setItem(`menu_template_${menu.id}`, selectedTemplate);
      
      const updatedMenu = await updateMenuFn({
        menuId: menu.id,
        name,
        description: description || '',
        publicUrl: finalPublicUrl,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
        currencyPosition: currency.position,
        template: selectedTemplate
      });
      
      console.log('Updated menu:', updatedMenu);
      
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
        <label htmlFor="template" className="block text-sm font-medium text-gray-700">
          Menu Template
        </label>
        <select
          id="template"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value as MenuTemplate)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          disabled={isSaving}
        >
          {AVAILABLE_TEMPLATES.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500">
          Choose how your menu will be displayed to customers.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {AVAILABLE_TEMPLATES.map((template) => (
            <div 
              key={template.id}
              className={`relative rounded-lg border p-4 cursor-pointer ${
                selectedTemplate === template.id 
                  ? 'border-amber-500 bg-amber-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate(template.id as MenuTemplate)}
            >
              <div className="flex items-start space-x-3">
                {template.id === 'default' ? (
                  <div className="flex-shrink-0 h-10 w-10 rounded bg-amber-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{template.description}</p>
                </div>
              </div>
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2">
                  <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
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