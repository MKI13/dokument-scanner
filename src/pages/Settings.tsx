import React, { useState, useEffect } from 'react';
import { githubService } from '../services/github.service';
import { modalService } from '../services/modal.service';
import { Settings as SettingsIcon, Github, Upload, Download, Check, X } from 'lucide-react';
import './Settings.css';

export const Settings: React.FC = () => {
  const [githubToken, setGithubToken] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadConfig();
    setLastSync(githubService.getLastSyncTime());
  }, []);

  const loadConfig = () => {
    const token = localStorage.getItem('github_token') || '';
    const owner = localStorage.getItem('github_owner') || '';
    const repo = localStorage.getItem('github_repo') || '';

    setGithubToken(token);
    setGithubOwner(owner);
    setGithubRepo(repo);
    setIsConfigured(githubService.isConfigured());
  };

  const handleSaveConfig = async () => {
    if (!githubToken || !githubOwner || !githubRepo) {
      await modalService.error('Bitte fülle alle Felder aus');
      return;
    }

    githubService.setConfig(githubToken, githubOwner, githubRepo);
    setIsConfigured(true);
    await modalService.success('GitHub Konfiguration gespeichert!');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const success = await githubService.testConnection();
      if (success) {
        await modalService.success('✅ Verbindung erfolgreich!');
      } else {
        await modalService.error('❌ Verbindung fehlgeschlagen. Prüfe deine Zugangsdaten.');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncToGitHub = async () => {
    setIsSyncing(true);
    try {
      const result = await githubService.syncToGitHub();
      if (result.success) {
        await modalService.success(result.message);
        setLastSync(githubService.getLastSyncTime());
      } else {
        await modalService.error(result.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromGitHub = async () => {
    const confirmed = await modalService.confirm(
      'Möchtest du die Daten von GitHub laden?\n\n' +
      '⚠️ Dies überschreibt lokale Änderungen nicht!',
      'Von GitHub laden'
    );

    if (!confirmed) return;

    setIsSyncing(true);
    try {
      const result = await githubService.syncFromGitHub();
      if (result.success) {
        await modalService.success(result.message);
        setLastSync(githubService.getLastSyncTime());
      } else {
        await modalService.error(result.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearConfig = async () => {
    const confirmed = await modalService.confirm(
      'Möchtest du die GitHub-Konfiguration wirklich löschen?',
      'Konfiguration löschen'
    );

    if (!confirmed) return;

    githubService.clearConfig();
    setGithubToken('');
    setGithubOwner('');
    setGithubRepo('');
    setIsConfigured(false);
    await modalService.success('Konfiguration gelöscht');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Einstellungen</h1>
      </div>

      <div className="page-content">
        <div className="settings-section">
          <div className="section-header">
            <Github size={24} />
            <h2>GitHub Backup</h2>
          </div>

          <div className="settings-description">
            <p>
              Sichere deine Dokumente automatisch in einem privaten GitHub Repository.
              Deine Daten bleiben privat und sind überall verfügbar.
            </p>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label>GitHub Personal Access Token</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
              />
              <small>
                Erstelle einen Token unter:
                <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">
                  GitHub → Settings → Developer settings → Personal access tokens
                </a>
                <br />
                Benötigte Rechte: <code>repo</code> (Full control of private repositories)
              </small>
            </div>

            <div className="form-group">
              <label>Repository Owner (Username)</label>
              <input
                type="text"
                value={githubOwner}
                onChange={(e) => setGithubOwner(e.target.value)}
                placeholder="dein-username"
              />
            </div>

            <div className="form-group">
              <label>Repository Name</label>
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="dokument-scanner-backup"
              />
              <small>
                Erstelle ein <strong>privates</strong> Repository auf GitHub
              </small>
            </div>

            <div className="form-actions">
              <button
                onClick={handleSaveConfig}
                className="btn-primary"
              >
                <Check size={18} />
                <span>Speichern</span>
              </button>

              {isConfigured && (
                <>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="btn-secondary"
                  >
                    {isTesting ? '🔄 Teste...' : '🔍 Verbindung testen'}
                  </button>

                  <button
                    onClick={handleClearConfig}
                    className="btn-danger"
                  >
                    <X size={18} />
                    <span>Löschen</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {isConfigured && (
            <div className="sync-section">
              <h3>Synchronisation</h3>

              {lastSync && (
                <div className="last-sync">
                  Letzte Synchronisation: {new Date(lastSync).toLocaleString('de-DE')}
                </div>
              )}

              <div className="sync-actions">
                <button
                  onClick={handleSyncToGitHub}
                  disabled={isSyncing}
                  className="btn-sync btn-upload"
                >
                  <Upload size={18} />
                  <span>{isSyncing ? 'Synchronisiere...' : 'Zu GitHub hochladen'}</span>
                </button>

                <button
                  onClick={handleSyncFromGitHub}
                  disabled={isSyncing}
                  className="btn-sync btn-download"
                >
                  <Download size={18} />
                  <span>{isSyncing ? 'Lade...' : 'Von GitHub laden'}</span>
                </button>
              </div>

              <div className="sync-info">
                <p>
                  💡 <strong>Tipp:</strong> Aktiviere Auto-Sync in den erweiterten Einstellungen
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
