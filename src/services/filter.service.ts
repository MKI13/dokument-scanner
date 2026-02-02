/**
 * Filter Service - Erweiterte Filter-Funktionen
 */

import { Document } from '../types/document';

export interface FilterOptions {
  searchText?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: Date;
  dateTo?: Date;
  customers?: string[];
  tags?: string[];
}

class FilterService {
  
  applyFilters(documents: Document[], filters: FilterOptions): Document[] {
    let filtered = [...documents];

    // Text-Suche
    if (filters.searchText?.trim()) {
      const query = filters.searchText.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.filename.toLowerCase().includes(query) ||
        doc.customer?.toLowerCase().includes(query) ||
        doc.ocrText?.toLowerCase().includes(query) ||
        doc.invoiceNumber?.toLowerCase().includes(query)
      );
    }

    // Betrag-Filter
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(doc => 
        doc.amount !== undefined && doc.amount >= filters.minAmount!
      );
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(doc => 
        doc.amount !== undefined && doc.amount <= filters.maxAmount!
      );
    }

    // Datum-Filter
    if (filters.dateFrom) {
      filtered = filtered.filter(doc => {
        if (!doc.documentDate) return false;
        return new Date(doc.documentDate) >= filters.dateFrom!;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(doc => {
        if (!doc.documentDate) return false;
        return new Date(doc.documentDate) <= filters.dateTo!;
      });
    }

    // Kunden-Filter
    if (filters.customers && filters.customers.length > 0) {
      filtered = filtered.filter(doc =>
        doc.customer && filters.customers!.includes(doc.customer)
      );
    }

    // Tags-Filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(doc => {
        if (!doc.tags || doc.tags.length === 0) return false;
        return filters.tags!.some(tag => doc.tags!.includes(tag));
      });
    }

    return filtered;
  }

  getAllCustomers(documents: Document[]): string[] {
    const customers = new Set<string>();
    documents.forEach(doc => {
      if (doc.customer) customers.add(doc.customer);
    });
    return Array.from(customers).sort();
  }

  getAllTags(documents: Document[]): string[] {
    const tags = new Set<string>();
    documents.forEach(doc => {
      doc.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  getAmountRange(documents: Document[]): { min: number; max: number } {
    const amounts = documents
      .map(doc => doc.amount)
      .filter((amount): amount is number => amount !== undefined);
    
    if (amounts.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...amounts),
      max: Math.max(...amounts)
    };
  }

  getDateRange(documents: Document[]): { min: Date | null; max: Date | null } {
    const dates = documents
      .map(doc => doc.documentDate)
      .filter((date): date is Date => date !== undefined)
      .map(date => new Date(date));
    
    if (dates.length === 0) return { min: null, max: null };
    
    return {
      min: new Date(Math.min(...dates.map(d => d.getTime()))),
      max: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }
}

export const filterService = new FilterService();
