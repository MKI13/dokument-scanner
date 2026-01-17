import { Calendar, FileText, Search, Trash2, Upload, Users, Copy } from 'lucide-react';

interface HeaderProps {
  activeView: 'upload' | 'documents' | 'customers' | 'month' | 'calendar' | 'duplicates';
  onViewChange: (view: 'upload' | 'documents' | 'customers' | 'month' | 'calendar' | 'duplicates') => void;
  onDeleteAll: () => void;
  deleteMode: boolean;
  onToggleDeleteMode: () => void;
}

export default function Header({ activeView, onViewChange, onDeleteAll, deleteMode, onToggleDeleteMode }: HeaderProps) {
  const handleDeleteClick = () => {
    if (deleteMode) {
      if (confirm('Möchten Sie wirklich ALLE Dokumente löschen?')) {
        onDeleteAll();
      }
    }
    onToggleDeleteMode();
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Dokument Scanner</h1>
              <p className="text-blue-100 text-sm">ef-sin Schreinerei</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-100 text-sm">v1.5.9</span>
            <button
              onClick={handleDeleteClick}
              className={`p-2 rounded-lg transition-colors ${
                deleteMode 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              title={deleteMode ? 'Alle löschen' : 'Lösch-Modus'}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <nav className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => onViewChange('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeView === 'upload'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 hover:bg-blue-400'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>

          <button
            onClick={() => onViewChange('documents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeView === 'documents'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 hover:bg-blue-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dokumente</span>
          </button>

          <button
            onClick={() => onViewChange('customers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeView === 'customers'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 hover:bg-blue-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kunden</span>
          </button>

          <button
            onClick={() => onViewChange('month')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeView === 'month'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 hover:bg-blue-400'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Monat</span>
          </button>

          <button
            onClick={() => onViewChange('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeView === 'calendar'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 hover:bg-blue-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Kalender</span>
          </button>

          <button
            onClick={() => onViewChange('duplicates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeView === 'duplicates'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 hover:bg-blue-400'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Duplikate</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
