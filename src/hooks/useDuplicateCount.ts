import { useState, useEffect } from 'react';
import { db } from '../services/database.service';

export const useDuplicateCount = () => {
  const [duplicateCount, setDuplicateCount] = useState(0);

  useEffect(() => {
    const checkDuplicates = async () => {
      try {
        const docs = await db.documents.toArray();

        const filenameMap = new Map<string, number>();

        docs.forEach(doc => {
          const filename = doc.filename.toLowerCase();
          filenameMap.set(filename, (filenameMap.get(filename) || 0) + 1);
        });

        let duplicateGroups = 0;
        filenameMap.forEach(count => {
          if (count > 1) {
            duplicateGroups++;
          }
        });

        setDuplicateCount(duplicateGroups);
      } catch (error) {
        console.error('Fehler beim Zählen der Duplikate:', error);
        setDuplicateCount(0);
      }
    };

    checkDuplicates();

    // Aktualisiere alle 5 Sekunden
    const interval = setInterval(checkDuplicates, 5000);

    return () => clearInterval(interval);
  }, []);

  return duplicateCount;
};
