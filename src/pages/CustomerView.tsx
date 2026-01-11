import React, { useState, useEffect } from 'react';
import { DocumentCard } from '../components/Document/DocumentCard';
import { documentService } from '../services/document.service';
import { Document } from '../types/document';
import { Search, X } from 'lucide-react';
import './CustomerView.css';

interface CustomerViewProps {
  setSwipeEnabled: (enabled: boolean) => void;
  refreshTrigger?: number;
}

interface CustomerGroup {
  name: string;
  documents: Document[];
  total: number;
}

export const CustomerView: React.FC<CustomerViewProps> = ({ 
  setSwipeEnabled, 
  refreshTrigger = 0 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ← KORRIGIERT: useEffect mit refreshTrigger
  useEffect(() => {
    console.log('🔄 CUSTOMER VIEW REFRESH:', refreshTrigger);
    loadCustomers();
  }, [refreshTrigger]);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📚 LADE ALLE DOKUMENTE...');
      const allDocs = await documentService.getAllDocuments();
      console.log('✅ GELADEN:', allDocs.length, 'Dokumente');
      
      // SICHER: Filtere ungültige Dokumente
      const validDocs = allDocs.filter(doc => {
        if (!doc) {
          console.warn('⚠️ NULL DOKUMENT GEFUNDEN!');
          return false;
        }
        if (!doc.id) {
          console.warn('⚠️ DOKUMENT OHNE ID:', doc);
          return false;
        }
        if (!doc.blob) {
          console.warn('⚠️ DOKUMENT OHNE BLOB:', doc.id);
          return false;
        }
        return true;
      });

      console.log('✅ VALIDE DOKUMENTE:', validDocs.length);
      
      // Gruppiere nach Kunde
      const grouped = validDocs.reduce((acc, doc) => {
        if (!doc.customer) {
          console.log('ℹ️ Dokument ohne Kunde:', doc.filename);
          return acc;
        }
        
        const customer = doc.customer;
        
        if (!acc[customer]) {
          acc[customer] = {
            name: customer,
            documents: [],
            total: 0
          };
        }
        
        acc[customer].documents.push(doc);
        acc[customer].total += doc.amount || 0;
        
        return acc;
      }, {} as Record<string, CustomerGroup>);

      const groups = Object.values(grouped).sort((a, b) => b.total - a.total);
      
      console.log('👥 KUNDEN-GRUPPEN:', groups.length);
      groups.forEach(g => {
        console.log(`  - ${g.name}: ${g.documents.length} Docs, ${g.total.toFixed(2)}€`);
      });
      
      setCustomerGroups(groups);
      
    } catch (error) {
      console.error('❌ FEHLER BEIM LADEN:', error);
      setError('Fehler beim Laden der Kunden: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomer = (customerName: string) => {
    console.log('🔄 TOGGLE KUNDE:', customerName);
    
    try {
      const newExpanded = new Set(expandedCustomers);
      if (newExpanded.has(customerName)) {
        newExpanded.delete(customerName);
        console.log('➖ GESCHLOSSEN:', customerName);
      } else {
        newExpanded.add(customerName);
        console.log('➕ GEÖFFNET:', customerName);
      }
      setExpandedCustomers(newExpanded);
    } catch (error) {
      console.error('❌ FEHLER BEIM TOGGLE:', error);
    }
  };

  const filteredGroups = searchTerm
    ? customerGroups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : customerGroups;

  const totalDocuments = customerGroups.reduce((sum, g) => sum + g.documents.length, 0);
  const totalCustomers = customerGroups.length;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Lade Kunden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Fehler</h2>
        <p>{error}</p>
        <button onClick={loadCustomers}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="customer-view">
      <div className="customer-header">
        <h1>Kunden</h1>
        <p>{totalCustomers} Kunden • {totalDocuments} Dokumente</p>
      </div>

      <div className="search-box">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Kunden durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="clear-button"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="customer-list">
        {filteredGroups.map(group => {
          const isExpanded = expandedCustomers.has(group.name);
          
          return (
            <div key={group.name} className="customer-group">
              <div
                className="customer-summary"
                onClick={() => toggleCustomer(group.name)}
              >
                <div className="customer-info">
                  <h3>{group.name}</h3>
                  <p>
                    {group.documents.length} Dokument{group.documents.length !== 1 ? 'e' : ''} • {group.total.toFixed(2)} €
                  </p>
                </div>
                <button className="expand-button">
                  {isExpanded ? '−' : '+'}
                </button>
              </div>

              {isExpanded && (
                <div className="customer-documents">
                  {group.documents.map(doc => {
                    if (!doc || !doc.id || !doc.blob) {
                      console.error('❌ UNGÜLTIGES DOKUMENT:', doc);
                      return null;
                    }
                    
                    return (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        setSwipeEnabled={setSwipeEnabled}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="no-customers">
          <p>
            {searchTerm
              ? 'Keine Kunden gefunden'
              : 'Noch keine Kunden vorhanden'}
          </p>
        </div>
      )}
    </div>
  );
};
