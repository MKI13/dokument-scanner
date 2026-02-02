import { Calendar, FileText, Search, Trash2, Upload, Users, Copy, Settings } from 'lucide-react';

interface HeaderProps {
  activeView: 'upload' | 'documents' | 'customers' | 'month' | 'calendar' | 'duplicates' | 'settings';
  onViewChange: (view: 'upload' | 'documents' | 'customers' | 'month' | 'calendar' | 'duplicates' | 'settings') => void;
  onDeleteAll: () => void;
  deleteMode: boolean;
  onToggleDeleteMode: () => void;
  duplicateCount: number;
}

export default function Header({ activeView, onViewChange, onDeleteAll, deleteMode, onToggleDeleteMode, duplicateCount }: HeaderProps) {
  const handleDeleteClick = () => {
    if (deleteMode) {
      if (confirm('Möchten Sie wirklich ALLE Dokumente löschen?')) {
        onDeleteAll();
      }
    }
    onToggleDeleteMode();
  };

  return (
    <>
      <div className="app-header">
        <h1>Dokument Scanner</h1>
        <span className="app-version">v1.7.0</span>
      </div>

      <div className="top-navigation">
        <button
          onClick={() => onViewChange('upload')}
          className={activeView === 'upload' ? 'active' : ''}
        >
          <Upload size={20} />
          <span>Upload</span>
        </button>

        <button
          onClick={() => onViewChange('documents')}
          className={activeView === 'documents' ? 'active' : ''}
        >
          <FileText size={20} />
          <span>Dokumente</span>
        </button>

        <button
          onClick={() => onViewChange('customers')}
          className={activeView === 'customers' ? 'active' : ''}
        >
          <Users size={20} />
          <span>Kunden</span>
        </button>

        <button
          onClick={() => onViewChange('month')}
          className={activeView === 'month' ? 'active' : ''}
        >
          <Search size={20} />
          <span>Monat</span>
        </button>

        <button
          onClick={() => onViewChange('calendar')}
          className={activeView === 'calendar' ? 'active' : ''}
        >
          <Calendar size={20} />
          <span>Kalender</span>
        </button>

        <button
          onClick={() => onViewChange('duplicates')}
          className={`${activeView === 'duplicates' ? 'active' : ''} ${duplicateCount > 0 ? 'has-duplicates' : ''} ${duplicateCount >= 5 ? 'critical-duplicates' : ''}`}
        >
          <Copy size={20} />
          <span>Duplikate</span>
          {duplicateCount > 0 && (
            <span className="duplicate-badge">{duplicateCount}</span>
          )}
        </button>

        <button
          onClick={() => onViewChange('settings')}
          className={activeView === 'settings' ? 'active' : ''}
        >
          <Settings size={20} />
          <span>Einstellungen</span>
        </button>

        <button
          onClick={handleDeleteClick}
          className={deleteMode ? 'delete-mode' : ''}
          title={deleteMode ? 'Alle löschen' : 'Lösch-Modus'}
        >
          <Trash2 size={20} />
          <span>Löschen</span>
        </button>
      </div>
    </>
  );
}
