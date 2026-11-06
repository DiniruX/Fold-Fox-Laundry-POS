import React, { useMemo, useState } from 'react';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/helpers';

/**
 * Searchable single-select. Type to filter, arrow keys + Enter to pick.
 *
 * options: [{ value, label, description?, keywords? }]
 * value:   the selected option's value (or '' / null)
 * onChange(value)
 */
const SearchSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Type to search...',
  emptyText = 'No matches',
  error,
  helperText,
  required = false,
  disabled = false,
  allowClear = true,
  className = '',
  size = 'md',
}) => {
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)) || null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.label} ${o.description || ''} ${o.keywords || ''}`.toLowerCase().includes(q)
    );
  }, [options, query]);

  const inputPadding = size === 'sm' ? 'py-2 text-sm' : 'py-3 text-sm';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-[#fe7f2d] ml-1">*</span>}
        </label>
      )}
      <Combobox
        value={selected}
        onChange={(opt) => {
          onChange(opt ? opt.value : '');
          setQuery('');
        }}
        onClose={() => setQuery('')}
        disabled={disabled}
        immediate
      >
        <div className="relative">
          <ComboboxInput
            className={cn(
              'w-full pl-3 pr-16 border-2 rounded-lg font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500',
              inputPadding,
              error
                ? 'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-400'
                : 'border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-[#fe7f2d] hover:border-gray-300 bg-white'
            )}
            displayValue={(opt) => (opt ? opt.label : '')}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-0.5">
            {allowClear && selected && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setQuery('');
                }}
                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                aria-label="Clear"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            <ComboboxButton className="p-1 rounded-md text-gray-400 hover:text-gray-600">
              <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor="bottom start"
            className="z-[60] mt-1 w-[var(--input-width)] max-h-64 overflow-auto rounded-xl bg-white py-1 shadow-xl ring-1 ring-black/5 focus:outline-none [--anchor-gap:4px] empty:invisible"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">{emptyText}</div>
            ) : (
              filtered.map((opt) => (
                <ComboboxOption
                  key={opt.value}
                  value={opt}
                  className="group flex items-start gap-2 px-3 py-2 cursor-pointer select-none data-[focus]:bg-orange-50 data-[selected]:bg-orange-50/60"
                >
                  <CheckIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#fe7f2d] invisible group-data-[selected]:visible" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-xs text-gray-500 truncate">{opt.description}</div>
                    )}
                  </div>
                  {opt.badge && (
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 flex-shrink-0">
                      {opt.badge}
                    </span>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};

export default SearchSelect;
