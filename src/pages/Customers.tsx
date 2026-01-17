import React, { useState, useEffect } from 'react';
import { db } from '../services/database.service';
import { stateService } from '../services/state.service';
import { CustomerView } from './CustomerView';
import { Document } from '../types/document';
import { User, Search } from 'lucide-react';
import './Customers.css';

interface CustomersProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

interface CustomerData {
  name: string;
  documentCount: number;
  totalAmount: number;
  latestDocument?: Document;
}

export const Customers: React.FC<CustomersProps> = ({ setSwipeEnabled }) => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const docs = await db.documents.toArray();
      
      const customerMap = new Map<string, CustomerData>();
      
      docs.forEach(doc => {
        if (!doc.customer) return;
        
        const existing = customerMap.get(doc.customer);
        
        if (existing) {
          existing.documentCount++;
          existing.totalAmount += doc.amount || 0;
          
          if (!existing.latestDocument || 
              (doc.uploadDate > existing.latestDocument.uploadDate)) {
            existing.latestDocument = doc;
          }
        } else {
          customerMap.set(doc.customer, {
            name: doc.customer,
            documentCount: 1,
            totalAmount: doc.amount || 0,
            latestDocument: doc
          });
        }
      });
      
      const customerList = Array.from(customerMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setCustomers(customerList);
      
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(query)
    );
    
    setFilteredCustomers(filtered);
  };

  const handleCustomerClick = (customerName: string) => {
    setSelectedCustomer(customerName);
  };

  const handleCloseCustomerView = () => {
    setSelectedCustomer(null);
    loadCustomers();
  };

  if (selectedCustomer) {
    return (
      <CustomerView
        customerName={selectedCustomer}
        onClose={handleCloseCustomerView}
        setSwipeEnabled={setSwipeEnabled}
      />
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Lade Kunden...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
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
        <span>
          {filteredCustomers.length === customers.length
            ? `${customers.length} Kunden`
            : `${filteredCustomers.length} von ${customers.length} Kunden`
          }
        </span>
      </div>

      <div className="page-content">
        {filteredCustomers.length > 0 ? (
          <div className="customers-list">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.name}
                className="customer-card"
                onClick={() => handleCustomerClick(customer.name)}
              >
                <div className="customer-icon">
                  <User size={32} />
                </div>
                <div className="customer-info">
                  <h3>{customer.name}</h3>
                  <div className="customer-stats">
                    <span>📄 {customer.documentCount} Dokumente</span>
                    <span>💰 {customer.totalAmount.toFixed(2)} EUR</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-customers">
            <p>
              {searchQuery ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
