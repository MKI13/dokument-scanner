import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, Eye, Download } from 'lucide-react';
import { duplicateDetectionService, DuplicateMatch } from '../../services/duplicate-detection.service';
import { Document } from '../../types';
import { documentService } from '../../services/document.service';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { extractionService } from '../../services/extraction.service';

interface DuplicateManagerProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const DuplicateManager: React.FC<DuplicateManagerProps> = ({ onClose, onRefresh }) => {
  const [duplicateGroups, setDuplicateGroups] = useState<Map<string, DuplicateMatch[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    scanForDuplicates();
  }, []);
  
  const scanForDuplicates = async () => {
    setLoading(true);
    try {
      const groups = await duplicateDetectionService.findAllDuplicates();
      setDuplicateGroups(groups);
    } catch (error) {
      console.error('Fehler beim Scannen:', error);
      alert('Fehler beim Scannen nach Duplikaten');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSelection = (docId: string) => {
    setSelectedForDeletion(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };
  
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.size === 0) {
      alert('Keine Dokumente zum Löschen ausgewählt');
      return;
    }
    
    if (!confirm(`Wirklich ${selectedForDeletion.size} Dokument(e) löschen?`)) {
      return;
    }
    
    try {
      for (const id of selectedForDeletion) {
        await documentService.deleteDocument(id);
      }
      
      alert(`✅ ${selectedForDeletion.size} Dokument(e) gelöscht`);
      setSelectedForDeletion(new Set());
      await scanForDuplicates();
      onRefresh();
      
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Dokumente');
    }
  };
  
  const handleSelectAllInGroup = (matches: DuplicateMatch[], keepFirst: boolean) => {
    const newSelection = new Set(selectedForDeletion);
    
    matches.forEach((match, index) => {
      if (keepFirst && index === 0) {
        newSelection.delete(match.document.id);
      } else if (!keepFirst || index > 0) {
        newSelection.add(match.document.id);
      }
    });
    
    setSelectedForDeletion(newSelection);
  };
  
  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content duplicate-manager" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Scanne nach Duplikaten...</div>
        </div>
      </div>
    );
  }
  
  const totalDuplicates = Array.from(duplicateGroups.values()).reduce(
    (sum, group) => sum + group.length - 1, 0
  );
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content duplicate-manager" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Duplikat-Verwaltung</h2>
            {duplicateGroups.size > 0 && (
              <p className="duplicate-summary">
                {duplicateGroups.size} Gruppe(n) mit insgesamt {totalDuplicates} Duplikat(en) gefunden
              </p>
            )}
          </div>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body duplicate-body">
          {duplicateGroups.size === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={64} color="#10b981" />
              <h3>Keine Duplikate gefunden</h3>
              <p>Alle Dokumente sind einzigartig! 🎉</p>
            </div>
          ) : (
            <div className="duplicate-groups">
              {Array.from(duplicateGroups.entries()).map(([originalId, matches], groupIndex) => (
                <div key={originalId} className="duplicate-group">
                  <div className="group-header">
                    <AlertTriangle size={20} color="#f59e0b" />
                    <h3>Gruppe {groupIndex + 1}</h3>
                    <button 
                      className="select-all-btn"
                      onClick={() => handleSelectAllInGroup(matches, true)}
                    >
                      Alle außer Original auswählen
                    </button>
                  </div>
                  
                  {matches.map((match, index) => (
                    <div 
                      key={match.document.id}
                      className={`duplicate-item ${index === 0 ? 'original' : ''} ${selectedForDeletion.has(match.document.id) ? 'selected' : ''}`}
                    >
                      <div className="duplicate-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedForDeletion.has(match.document.id)}
                          onChange={() => toggleSelection(match.document.id)}
                          disabled={index === 0}
                        />
                      </div>
                      
                      <div className="duplicate-info">
                        {index === 0 && <span className="original-badge">Original</span>}
                        <h4>{match.document.filename}</h4>
                        <div className="duplicate-meta">
                          <span>{match.document.customer || 'Kein Kunde'}</span>
                          <span>•</span>
                          <span>
                            {match.document.documentDate 
                              ? format(match.document.documentDate, 'dd.MM.yyyy', { locale: de })
                              : 'Kein Datum'}
                          </span>
                          <span>•</span>
                          <span>
                            {match.document.amount !== null
                              ? extractionService.formatCurrency(match.document.amount)
                              : '-'}
                          </span>
                        </div>
                        <div className="similarity-info">
                          <strong>Ähnlichkeit: {match.similarity}%</strong>
                          <span className="reasons">{match.reasons.join(', ')}</span>
                        </div>
                      </div>
                      
                      <div className="duplicate-actions">
                        <button
                          onClick={() => {
                            const url = URL.createObjectURL(match.document.originalFile);
                            window.open(url, '_blank');
                          }}
                          title="Ansehen"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => documentService.exportDocument(match.document)}
                          title="Herunterladen"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {duplicateGroups.size > 0 && (
          <div className="modal-footer">
            <div className="selection-info">
              {selectedForDeletion.size} Dokument(e) zum Löschen ausgewählt
            </div>
            <button 
              className="cancel-button" 
              onClick={onClose}
            >
              Schließen
            </button>
            <button 
              className="delete-button" 
              onClick={handleDeleteSelected}
              disabled={selectedForDeletion.size === 0}
            >
              <Trash2 size={18} />
              Ausgewählte löschen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
