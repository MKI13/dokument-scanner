import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/database.service';
import { stateService } from '../services/state.service';
import { Document } from '../types/document';
import { ArrowUpDown, Search, ChevronDown, ChevronRight } from 'lucide-react';
import './Customers.css';

interface CustomersProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

type CustomerSortOption = 'alphabet' | 'count' | 'recent';

interface CustomerData {
  name: string;
  count: number;
  totalAmount: number;
  lastDate?: Date;
  documents: Document[];
}

export const Customers: React.FC<CustomersProps> = ({ setSwipeEnabled }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // WICHTIG: State aus localStorage laden BEI COMPONENT MOUNT
  const [initialized, setInitialized] = useState(false);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<CustomerSortOption>('alphabet');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  // Lade gespeicherten State beim ersten Render
  useEffect(() => {
    console.log('🔄 Customers Component mounted');
    const savedState = stateService.getCustomersState();
    
    setSearchQuery(savedState.searchQuery);
    setSortBy(savedState.sortBy);
    setExpandedCustomers(new Set(savedState.expandedCustomers));
    setInitialized(true);
    
    console.log('✅ State wiederhergestellt:', savedState);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (initialized) {
      filterAndSortCustomers();
    }
  }, [searchQuery, customers, sortBy, initialized]);

  // Speichere State bei jeder Änderung
  useEffect(() => {
    if (initialized) {
      stateService.saveCustomersState({
        sortBy,
        searchQuery,
        expandedCustomers: Array.from(expandedCustomers)
      });
    }
  }, [sortBy, searchQuery, expandedCustomers, initialized]);

  // Speichere Scroll-Position
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        stateService.saveScrollPosition('customers', contentRef.current.scrollTop);
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      
      // Restore scroll
      if (initialized) {
        stateService.restoreScrollPosition('customers', element);
      }
      
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [customers.length, initialized]);

  const loadCustomers = async () => {
    const docs = await db.documents.toArray();
    
    const customerMap = new Map<string, CustomerData>();
    
    docs.forEach(doc => {
      if (doc.customer) {
        const existing = customerMap.get(doc.customer);
        if (existing) {
          existing.count++;
          existing.totalAmount += doc.amount || 0;
          existing.documents.push(doc);
          if (doc.date && (!existing.lastDate || doc.date > existing.lastDate)) {
            existing.lastDate = doc.date;
          }
        } else {
          customerMap.set(doc.customer, {
            name: doc.customer,
            count: 1,
            totalAmount: doc.amount || 0,
            lastDate: doc.date,
            documents: [doc]
          });
        }
      }
    });

    const customerList = Array.from(customerMap.values());
    setCustomers(customerList);
    console.log(`✅ ${customerList.length} Kunden geladen`);
  };

  const filterAndSortCustomers = () => {
    let filtered = customers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = customers.filter(c =>
        c.name.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'alphabet':
          return a.name.localeCompare(b.name);
        
        case 'count':
          return b.count - a.count;
        
        case 'recent':
          if (!a.lastDate && !b.lastDate) return 0;
          if (!a.lastDate) return 1;
          if (!b.lastDate) return -1;
          return b.lastDate.getTime() - a.lastDate.getTime();
        
        default:
          return 0;
      }
    });

    setFilteredCustomers(sorted);
  };

  const getSortLabel = (): string => {
    switch (sortBy) {
      case 'alphabet': return 'A-Z';
      case 'count': return 'Anzahl';
      case 'recent': return 'Neueste';
    }
  };

  const cycleSortOption = () => {
    const options: CustomerSortOption[] = ['alphabet', 'count', 'recent'];
    const currentIndex = options.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % options.length;
    console.log(`🔄 Sortierung gewechselt: ${sortBy} → ${options[nextIndex]}`);
    setSortBy(options[nextIndex]);
  };

  const toggleCustomer = (customerName: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerName)) {
      newExpanded.delete(customerName);
      console.log(`📁 Kunde zugeklappt: ${customerName}`);
    } else {
      newExpanded.add(customerName);
      console.log(`📂 Kunde aufgeklappt: ${customerName}`);
    }
    setExpandedCustomers(newExpanded);
  };

  const isExpanded = (customerName: string): boolean => {
    return expandedCustomers.has(customerName);
  };

  if (!initialized) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Lade Kunden...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>👥 Kunden</h1>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Suche nach Kunde..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="stats-bar">
        <span>{filteredCustomers.length} Kunden</span>
        <button 
          onClick={cycleSortOption}
          className="sort-button"
          title="Sortierung ändern"
        >
          <ArrowUpDown size={16} />
          <span>{getSortLabel()}</span>
        </button>
      </div>

      <div className="page-content" ref={contentRef}>
        <div className="customers-list">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => {
              const expanded = isExpanded(customer.name);
              
              return (
                <div key={customer.name} className="customer-item">
                  <div 
                    className={`customer-card ${expanded ? 'expanded' : ''}`}
                    onClick={() => toggleCustomer(customer.name)}
                  >
                    <div className="customer-info">
                      <h3>{customer.name}</h3>
                      <div className="customer-stats">
                        <span>📄 {customer.count} Dokumente</span>
                        <span>💰 {customer.totalAmount.toFixed(2)} EUR</span>
                        {customer.lastDate && (
                          <span>📅 {new Date(customer.lastDate).toLocaleDateString('de-DE')}</span>
                        )}
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronDown size={20} className="customer-arrow" />
                    ) : (
                      <ChevronRight size={20} className="customer-arrow" />
                    )}
                  </div>

                  {expanded && (
                    <div className="customer-documents">
                      {customer.documents
                        .sort((a, b) => 
                          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
                        )
                        .map(doc => (
                          <div key={doc.id} className="document-item">
                            <div className="document-thumbnail">
                              <img 
                                src={URL.createObjectURL(doc.blob)} 
                                alt={doc.filename}
                              />
                            </div>
                            <div className="document-details">
                              <h4>{doc.filename}</h4>
                              <div className="document-meta">
                                {doc.amount && (
                                  <span>💰 {doc.amount.toFixed(2)} EUR</span>
                                )}
                                {doc.date && (
                                  <span>📅 {new Date(doc.date).toLocaleDateString('de-DE')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-customers">
              <p>
                {searchQuery ? 'Keine Kunden gefunden' : 'Noch keine Kunden vorhanden'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
