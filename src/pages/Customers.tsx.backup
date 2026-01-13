import React, { useState, useEffect } from 'react';
import { db } from '../services/database.service';
import { Document } from '../types/document';
import { DocumentCard } from '../components/Document/DocumentCard';
import { Users } from 'lucide-react';
import './Customers.css';

interface CustomerGroup {
  name: string;
  documents: Document[];
  totalAmount: number;
}

interface CustomersProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

export const Customers: React.FC<CustomersProps> = ({ setSwipeEnabled }) => {
  const [customers, setCustomers] = useState<CustomerGroup[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const allDocs = await db.documents.toArray();
      
      // Gruppiere nach Kunde
      const customerMap = new Map<string, Document[]>();
      
      allDocs.forEach(doc => {
        const customer = doc.customer || 'Unbekannt';
        if (!customerMap.has(customer)) {
          customerMap.set(customer, []);
        }
        customerMap.get(customer)?.push(doc);
      });

      // Erstelle CustomerGroups
      const groups: CustomerGroup[] = [];
      customerMap.forEach((docs, name) => {
        const totalAmount = docs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
        groups.push({ name, documents: docs, totalAmount });
      });

      // Sortiere nach Anzahl Dokumente
      groups.sort((a, b) => b.documents.length - a.documents.length);
      
      setCustomers(groups);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = customers.find(c => c.name === selectedCustomer);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Lade Kunden...</p>
      </div>
    );
  }

  return (
    <div className="customers-page">
      <div className="page-header">
        <h1>👥 Kunden</h1>
        <span className="customer-count">
          {customers.length} Kunde{customers.length !== 1 ? 'n' : ''}
        </span>
      </div>

      {customers.length > 0 ? (
        <>
          <div className="customers-list">
            {customers.map(customer => (
              <div
                key={customer.name}
                className={`customer-item ${selectedCustomer === customer.name ? 'active' : ''}`}
                onClick={() => setSelectedCustomer(
                  selectedCustomer === customer.name ? null : customer.name
                )}
              >
                <div className="customer-avatar">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="customer-info">
                  <h3>{customer.name}</h3>
                  <div className="customer-meta">
                    <span>📄 {customer.documents.length} Dokument{customer.documents.length !== 1 ? 'e' : ''}</span>
                    <span>💰 {customer.totalAmount.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedGroup && (
            <div className="customer-documents">
              <h3>
                📄 {selectedGroup.documents.length} Dokument{selectedGroup.documents.length !== 1 ? 'e' : ''} von {selectedGroup.name}
              </h3>
              <div className="documents-grid">
                {selectedGroup.documents.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    setSwipeEnabled={setSwipeEnabled}
                    onUpdate={loadCustomers}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-customers">
          <Users size={64} />
          <h2>Keine Kunden</h2>
          <p>Lade Dokumente mit Kundennamen hoch</p>
        </div>
      )}
    </div>
  );
};
