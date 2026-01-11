class ModalService {
  private resolveCallback: ((value: boolean) => void) | null = null;
  private messageCallback: ((message: string, title: string, type: 'success' | 'error' | 'confirm' | 'info') => void) | null = null;

  setMessageHandler(handler: (message: string, title: string, type: 'success' | 'error' | 'confirm' | 'info') => void) {
    this.messageCallback = handler;
  }

  setConfirmHandler(handler: () => Promise<boolean>) {
    // Wird nicht mehr benötigt, da wir Promise direkt nutzen
  }

  private showMessage(message: string, title: string, type: 'success' | 'error' | 'confirm' | 'info'): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolveCallback = resolve;
      if (this.messageCallback) {
        this.messageCallback(message, title, type);
      }
    });
  }

  resolve(value: boolean) {
    if (this.resolveCallback) {
      this.resolveCallback(value);
      this.resolveCallback = null;
    }
  }

  async success(message: string, title: string = 'Erfolg') {
    await this.showMessage(message, title, 'success');
  }

  async error(message: string, title: string = 'Fehler') {
    await this.showMessage(message, title, 'error');
  }

  async confirm(message: string, title: string = 'Bestätigen'): Promise<boolean> {
    return await this.showMessage(message, title, 'confirm');
  }

  async info(message: string, title: string = 'Information') {
    await this.showMessage(message, title, 'info');
  }
}

export const modalService = new ModalService();
