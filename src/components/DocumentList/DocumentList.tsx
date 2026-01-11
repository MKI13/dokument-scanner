import React from 'react';
import { Document } from '../../types';
import { DocumentCard } from '../Document/DocumentCard';

interface DocumentListProps {
  documents: Document[];
  onDocumentClick?: (document: Document) => void;
  onDocumentEdit?: (document: Document) => void;
  onDocumentDelete?: (id: number) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents
}) => {
  return (
    <div style={{
      display: 'grid',
      gap: '16px',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
    }}>
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          showActions={true}
        />
      ))}
    </div>
  );
};
