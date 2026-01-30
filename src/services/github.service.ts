import { db } from './database.service';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  content: string;
}

class GitHubService {
  private getConfig(): GitHubConfig | null {
    const token = localStorage.getItem('github_token');
    const owner = localStorage.getItem('github_owner');
    const repo = localStorage.getItem('github_repo');

    if (!token || !owner || !repo) {
      return null;
    }

    return { token, owner, repo };
  }

  setConfig(token: string, owner: string, repo: string) {
    localStorage.setItem('github_token', token);
    localStorage.setItem('github_owner', owner);
    localStorage.setItem('github_repo', repo);
  }

  clearConfig() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_owner');
    localStorage.removeItem('github_repo');
  }

  isConfigured(): boolean {
    return this.getConfig() !== null;
  }

  async testConnection(): Promise<boolean> {
    const config = this.getConfig();
    if (!config) return false;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}`,
        {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return false;
    }
  }

  async syncToGitHub(): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    if (!config) {
      return { success: false, message: 'GitHub nicht konfiguriert' };
    }

    try {
      console.log('📤 Starte GitHub Sync...');

      // Exportiere Daten
      const documents = await db.documents.toArray();

      // Exportiere JSON
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        documents: documents.map(doc => ({
          filename: doc.filename,
          originalFilename: doc.originalFilename,
          uploadDate: doc.uploadDate.toISOString(),
          documentDate: doc.documentDate?.toISOString(),
          customer: doc.customer,
          amount: doc.amount,
          extractedText: doc.extractedText,
          ocrConfidence: doc.ocrConfidence,
          fileHash: doc.fileHash,
          invoiceNumber: doc.invoiceNumber,
          ocrText: doc.ocrText,
          tags: doc.tags
        }))
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const jsonBlob = new Blob([jsonString], { type: 'application/json' });
      const jsonBase64 = await this.blobToBase64(jsonBlob);

      // Upload JSON
      const jsonResult = await this.uploadFile(
        config,
        'backup.json',
        jsonBase64,
        'Update backup.json'
      );

      if (!jsonResult.success) {
        return { success: false, message: `JSON Upload fehlgeschlagen: ${jsonResult.message}` };
      }

      // Upload Bilder nach Jahr/Monat organisiert
      let uploadedImages = 0;
      for (const doc of documents) {
        if (doc.blob) {
          // Extrahiere Jahr/Monat aus documentDate oder uploadDate
          const date = doc.documentDate || doc.uploadDate;
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');

          // Bestimme Dateinamen
          const extension = this.getFileExtension(doc.blob.type);
          let basename: string;
          if (doc.originalFilename) {
            basename = doc.originalFilename.replace(/\.[^/.]+$/, '');
          } else {
            basename = doc.filename.replace(/\.[^/.]+$/, '');
          }

          const filename = `${basename}${extension}`;
          const path = `images/${year}/${month}/${filename}`;

          // Konvertiere Blob zu Base64
          const imageBase64 = await this.blobToBase64(doc.blob);

          // Upload Bild
          const imageResult = await this.uploadFile(
            config,
            path,
            imageBase64,
            `Update ${filename}`
          );

          if (imageResult.success) {
            uploadedImages++;
            console.log(`✅ Hochgeladen: ${path}`);
          } else {
            console.warn(`⚠️ Fehler bei: ${path}`);
          }
        }
      }

      const timestamp = new Date().toISOString();
      localStorage.setItem('last_sync', timestamp);

      console.log(`✅ GitHub Sync erfolgreich! ${uploadedImages} Bilder hochgeladen`);
      return {
        success: true,
        message: `Backup erfolgreich!\n${documents.length} Dokumente\n${uploadedImages} Bilder`
      };

    } catch (error: any) {
      console.error('❌ GitHub Sync Fehler:', error);
      return { success: false, message: `Sync Fehler: ${error.message}` };
    }
  }

  async syncFromGitHub(): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    if (!config) {
      return { success: false, message: 'GitHub nicht konfiguriert' };
    }

    try {
      console.log('📥 Lade Daten von GitHub...');
      console.log(`📂 Repository: ${config.owner}/${config.repo}`);

      // Download JSON - Probiere verschiedene Dateinamen
      const possiblePaths = ['backup.json', 'documents.json', 'data.json'];
      let jsonFile = null;
      let usedPath = '';

      for (const path of possiblePaths) {
        console.log(`🔍 Suche nach: ${path}`);
        jsonFile = await this.downloadFile(config, path);
        if (jsonFile) {
          usedPath = path;
          console.log(`✅ JSON gefunden: ${path}`);
          break;
        } else {
          console.log(`❌ Nicht gefunden: ${path}`);
        }
      }

      if (!jsonFile) {
        const errorMsg = `JSON-Datei nicht gefunden.\n\nGesuchte Dateien:\n${possiblePaths.join('\n')}\n\nPrüfe ob die Datei im Repository existiert:\nhttps://github.com/${config.owner}/${config.repo}`;
        console.error('❌ ' + errorMsg);
        return { success: false, message: errorMsg };
      }

      console.log(`📄 Verwende: ${usedPath}`);

      // Parse JSON
      const jsonText = atob(jsonFile.content);
      const backupData = JSON.parse(jsonText);

      console.log(`📄 ${backupData.documents.length} Dokumente gefunden`);

      // Lade alle Bilder von GitHub (Jahr/Monat Struktur)
      let loadedImages = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const backupDoc of backupData.documents) {
        try {
          // Bestimme Jahr/Monat
          const date = backupDoc.documentDate
            ? new Date(backupDoc.documentDate)
            : new Date(backupDoc.uploadDate);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');

          // Bestimme Dateinamen
          let basename: string;
          if (backupDoc.originalFilename) {
            basename = backupDoc.originalFilename.replace(/\.[^/.]+$/, '');
          } else {
            basename = backupDoc.filename.replace(/\.[^/.]+$/, '');
          }

          // Probiere verschiedene Extensions
          const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
          let imageBlob: Blob | null = null;

          for (const ext of possibleExtensions) {
            const filename = `${basename}${ext}`;
            const path = `images/${year}/${month}/${filename}`;

            const imageFile = await this.downloadFile(config, path);
            if (imageFile) {
              // Konvertiere Base64 zu Blob (WICHTIG: richtige MIME-Type!)
              const mimeType = this.getMimeTypeFromExtension(ext);
              imageBlob = this.base64ToBlob(imageFile.content, mimeType);
              console.log(`✅ Bild geladen: ${path} (${imageBlob.size} bytes)`);
              loadedImages++;
              break;
            }
          }

          // Erstelle Platzhalter wenn kein Bild gefunden
          if (!imageBlob) {
            console.warn(`⚠️ Kein Bild gefunden für ${backupDoc.filename}`);
            imageBlob = this.createPlaceholderBlob(backupDoc.filename);
          }

          // Speichere Dokument in Datenbank
          const newDoc = {
            filename: backupDoc.filename,
            originalFilename: backupDoc.originalFilename,
            blob: imageBlob,
            uploadDate: new Date(backupDoc.uploadDate),
            documentDate: backupDoc.documentDate ? new Date(backupDoc.documentDate) : undefined,
            customer: backupDoc.customer ?? undefined,
            amount: backupDoc.amount ?? undefined,
            extractedText: backupDoc.extractedText ?? undefined,
            ocrConfidence: backupDoc.ocrConfidence ?? undefined,
            fileHash: backupDoc.fileHash,
            invoiceNumber: backupDoc.invoiceNumber,
            ocrText: backupDoc.ocrText,
            tags: backupDoc.tags
          };

          await db.documents.add(newDoc as any);
          successCount++;

        } catch (error) {
          console.error('Fehler beim Import eines Dokuments:', error);
          errorCount++;
        }
      }

      console.log(`✅ Import abgeschlossen: ${successCount} erfolgreich, ${errorCount} Fehler, ${loadedImages} Bilder`);

      return {
        success: true,
        message: `Import erfolgreich!\n${successCount} Dokumente\n${loadedImages} Bilder geladen`
      };

    } catch (error: any) {
      console.error('❌ GitHub Download Fehler:', error);
      return { success: false, message: `Download Fehler: ${error.message}` };
    }
  }

  private async uploadFile(
    config: GitHubConfig,
    path: string,
    contentBase64: string,
    message: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Hole aktuellen SHA (falls Datei existiert)
      const existingFile = await this.downloadFile(config, path);

      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

      const body: any = {
        message,
        content: contentBase64,
      };

      if (existingFile) {
        body.sha = existingFile.sha;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload fehlgeschlagen');
      }

      return { success: true, message: 'Upload erfolgreich' };

    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private async downloadFile(
    config: GitHubConfig,
    path: string
  ): Promise<GitHubFile | null> {
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

      console.log(`  🔗 API Call: GET ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      console.log(`  📡 Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`  ℹ️ Datei existiert nicht: ${path}`);
          return null;
        }
        if (response.status === 403) {
          console.error(`  ❌ Zugriff verweigert (403). Prüfe Token-Berechtigungen!`);
          return null;
        }
        if (response.status === 401) {
          console.error(`  ❌ Nicht autorisiert (401). Token ungültig!`);
          return null;
        }
        const errorText = await response.text();
        console.error(`  ❌ HTTP ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`  ✅ Datei geladen: ${path} (${data.size} bytes)`);
      return data;

    } catch (error: any) {
      console.error(`  ❌ Fehler beim Download von ${path}:`, error.message || error);
      return null;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeMap: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.svg': 'image/svg+xml'
    };
    return mimeMap[extension.toLowerCase()] || 'image/jpeg';
  }

  private getFileExtension(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'application/pdf': '.pdf'
    };
    return mimeMap[mimeType] || '.jpg';
  }

  private createPlaceholderBlob(filename: string): Blob {
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#1e293b"/>
        <text x="200" y="140" font-family="Arial" font-size="16" fill="#64748b" text-anchor="middle">
          Bild nicht gefunden
        </text>
        <text x="200" y="170" font-family="Arial" font-size="12" fill="#94a3b8" text-anchor="middle">
          ${filename}
        </text>
      </svg>
    `;
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  getLastSyncTime(): string | null {
    return localStorage.getItem('last_sync');
  }
}

export const githubService = new GitHubService();
