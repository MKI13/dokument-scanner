import { db } from './database.service';
import { importService } from './import.service';

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
      const { json, zip } = await importService.exportWithImages();

      // Konvertiere zu Base64 für GitHub API
      const jsonBase64 = await this.blobToBase64(json);
      const zipBase64 = await this.blobToBase64(zip);

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

      // Upload ZIP
      const zipResult = await this.uploadFile(
        config,
        'images.zip',
        zipBase64,
        'Update images.zip'
      );

      if (!zipResult.success) {
        return { success: false, message: `ZIP Upload fehlgeschlagen: ${zipResult.message}` };
      }

      const timestamp = new Date().toISOString();
      localStorage.setItem('last_sync', timestamp);

      console.log('✅ GitHub Sync erfolgreich!');
      return { success: true, message: 'Backup erfolgreich zu GitHub hochgeladen!' };

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

      // Download JSON
      const jsonFile = await this.downloadFile(config, 'backup.json');
      if (!jsonFile) {
        return { success: false, message: 'backup.json nicht gefunden' };
      }

      // Download ZIP
      const zipFile = await this.downloadFile(config, 'images.zip');

      // Konvertiere Base64 zurück zu Blobs
      const jsonBlob = this.base64ToBlob(jsonFile.content, 'application/json');
      const zipBlob = zipFile ? this.base64ToBlob(zipFile.content, 'application/zip') : undefined;

      // Importiere Daten
      const jsonFileObj = new File([jsonBlob], 'backup.json', { type: 'application/json' });
      const zipFileObj = zipBlob ? new File([zipBlob], 'images.zip', { type: 'application/zip' }) : undefined;

      const result = await importService.importFromBackup(jsonFileObj, zipFileObj);

      console.log(`✅ Import von GitHub: ${result.success} erfolgreich, ${result.errors} Fehler`);

      return {
        success: true,
        message: `Import erfolgreich: ${result.success} Dokumente geladen`
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

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Download fehlgeschlagen');
      }

      return await response.json();

    } catch (error) {
      console.error(`Fehler beim Download von ${path}:`, error);
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

  getLastSyncTime(): string | null {
    return localStorage.getItem('last_sync');
  }
}

export const githubService = new GitHubService();
