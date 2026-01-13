/**
 * State Service - Speichert UI-Zustände zwischen Seiten-Wechseln
 */

interface AllDocumentsState {
  sortBy: 'alphabet' | 'date' | 'upload';
  searchQuery: string;
  scrollPosition: number;
}

interface CustomersState {
  sortBy: 'alphabet' | 'count' | 'recent';
  searchQuery: string;
  expandedCustomers: string[];
  scrollPosition: number;
}

interface CalendarState {
  selectedMonth: number;
  selectedYear: number;
  scrollPosition: number;
}

class StateService {
  private readonly KEY_PREFIX = 'dokument-scanner-state-';

  // ============================================
  // ALLE DOKUMENTE STATE
  // ============================================
  
  saveAllDocumentsState(state: Partial<AllDocumentsState>) {
    const current = this.getAllDocumentsState();
    const updated = { ...current, ...state };
    localStorage.setItem(
      `${this.KEY_PREFIX}all-documents`,
      JSON.stringify(updated)
    );
  }

  getAllDocumentsState(): AllDocumentsState {
    try {
      const stored = localStorage.getItem(`${this.KEY_PREFIX}all-documents`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Fehler beim Laden des States:', error);
    }
    
    return {
      sortBy: 'upload',
      searchQuery: '',
      scrollPosition: 0
    };
  }

  // ============================================
  // KUNDEN STATE
  // ============================================
  
  saveCustomersState(state: Partial<CustomersState>) {
    const current = this.getCustomersState();
    const updated = { ...current, ...state };
    localStorage.setItem(
      `${this.KEY_PREFIX}customers`,
      JSON.stringify(updated)
    );
  }

  getCustomersState(): CustomersState {
    try {
      const stored = localStorage.getItem(`${this.KEY_PREFIX}customers`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Fehler beim Laden des States:', error);
    }
    
    return {
      sortBy: 'alphabet',
      searchQuery: '',
      expandedCustomers: [],
      scrollPosition: 0
    };
  }

  // ============================================
  // KALENDER STATE
  // ============================================
  
  saveCalendarState(state: Partial<CalendarState>) {
    const current = this.getCalendarState();
    const updated = { ...current, ...state };
    localStorage.setItem(
      `${this.KEY_PREFIX}calendar`,
      JSON.stringify(updated)
    );
  }

  getCalendarState(): CalendarState {
    try {
      const stored = localStorage.getItem(`${this.KEY_PREFIX}calendar`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Fehler beim Laden des States:', error);
    }
    
    const now = new Date();
    return {
      selectedMonth: now.getMonth(),
      selectedYear: now.getFullYear(),
      scrollPosition: 0
    };
  }

  // ============================================
  // SCROLL POSITION HELPER
  // ============================================
  
  saveScrollPosition(page: string, position: number) {
    localStorage.setItem(`${this.KEY_PREFIX}scroll-${page}`, position.toString());
  }

  getScrollPosition(page: string): number {
    const stored = localStorage.getItem(`${this.KEY_PREFIX}scroll-${page}`);
    return stored ? parseInt(stored, 10) : 0;
  }

  restoreScrollPosition(page: string, element: HTMLElement | null) {
    if (!element) return;
    
    const position = this.getScrollPosition(page);
    if (position > 0) {
      setTimeout(() => {
        element.scrollTop = position;
      }, 100);
    }
  }
}

export const stateService = new StateService();
