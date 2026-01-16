import React, { useState, useEffect } from 'react';
import { Document } from '../types/document';
import { filterService, FilterOptions } from '../services/filter.service';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import './FilterPanel.css';

interface FilterPanelProps {
  documents: Document[];
  onFilterChange: (filters: FilterOptions) => void;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  documents,
  onFilterChange,
  onClose
}) => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const amountRange = filterService.getAmountRange(documents);
  const dateRange = filterService.getDateRange(documents);
  const allCustomers = filterService.getAllCustomers(documents);
  const allTags = filterService.getAllTags(documents);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  const handleReset = () => {
    setFilters({});
  };

  const hasActiveFilters = (): boolean => {
    return !!(
      filters.searchText ||
      filters.minAmount !== undefined ||
      filters.maxAmount !== undefined ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.customers?.length ||
      filters.tags?.length
    );
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <div className="filter-title">
          <Filter size={20} />
          <h3>Filter</h3>
        </div>
        <button onClick={onClose} className="filter-close">
          <X size={20} />
        </button>
      </div>

      <div className="filter-content">
        {/* Suchtext */}
        <div className="filter-group">
          <label>Suche</label>
          <input
            type="text"
            placeholder="Dateiname, Kunde, Text..."
            value={filters.searchText || ''}
            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
          />
        </div>

        {/* Betrag-Filter */}
        <div className="filter-group">
          <label>Betrag (EUR)</label>
          <div className="filter-range">
            <input
              type="number"
              placeholder="Von"
              min={amountRange.min}
              max={amountRange.max}
              step="0.01"
              value={filters.minAmount || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Bis"
              min={amountRange.min}
              max={amountRange.max}
              step="0.01"
              value={filters.maxAmount || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
          </div>
          {amountRange.max > 0 && (
            <div className="filter-hint">
              Bereich: {amountRange.min.toFixed(2)} - {amountRange.max.toFixed(2)} EUR
            </div>
          )}
        </div>

        {/* Datum-Filter */}
        <div className="filter-group">
          <label>Rechnungsdatum</label>
          <div className="filter-range">
            <input
              type="date"
              value={filters.dateFrom ? formatDate(filters.dateFrom) : ''}
              max={filters.dateTo ? formatDate(filters.dateTo) : undefined}
              onChange={(e) => setFilters({ 
                ...filters, 
                dateFrom: e.target.value ? new Date(e.target.value) : undefined 
              })}
            />
            <span>-</span>
            <input
              type="date"
              value={filters.dateTo ? formatDate(filters.dateTo) : ''}
              min={filters.dateFrom ? formatDate(filters.dateFrom) : undefined}
              onChange={(e) => setFilters({ 
                ...filters, 
                dateTo: e.target.value ? new Date(e.target.value) : undefined 
              })}
            />
          </div>
          {dateRange.min && dateRange.max && (
            <div className="filter-hint">
              Bereich: {formatDate(dateRange.min)} - {formatDate(dateRange.max)}
            </div>
          )}
        </div>

        {/* Erweiterte Filter */}
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="advanced-toggle"
        >
          <span>Erweiterte Filter</span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <>
            {/* Kunden-Filter */}
            {allCustomers.length > 0 && (
              <div className="filter-group">
                <label>Kunden ({allCustomers.length})</label>
                <div className="filter-checkboxes">
                  {allCustomers.map(customer => (
                    <label key={customer} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.customers?.includes(customer) || false}
                        onChange={(e) => {
                          const current = filters.customers || [];
                          setFilters({
                            ...filters,
                            customers: e.target.checked
                              ? [...current, customer]
                              : current.filter(c => c !== customer)
                          });
                        }}
                      />
                      <span>{customer}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tags-Filter */}
            {allTags.length > 0 && (
              <div className="filter-group">
                <label>Tags ({allTags.length})</label>
                <div className="filter-checkboxes">
                  {allTags.map(tag => (
                    <label key={tag} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.tags?.includes(tag) || false}
                        onChange={(e) => {
                          const current = filters.tags || [];
                          setFilters({
                            ...filters,
                            tags: e.target.checked
                              ? [...current, tag]
                              : current.filter(t => t !== tag)
                          });
                        }}
                      />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="filter-footer">
        {hasActiveFilters() && (
          <button onClick={handleReset} className="filter-reset">
            Zurücksetzen
          </button>
        )}
        <button onClick={onClose} className="filter-apply">
          Anwenden
        </button>
      </div>
    </div>
  );
};
