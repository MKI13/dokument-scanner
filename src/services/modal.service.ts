import './modal.css';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { Modal } from '../components/UI/Modal';

class ModalService {
  private container: HTMLDivElement | null = null;
  private root: any = null;

  private getContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'modal-root';
      document.body.appendChild(this.container);
      this.root = createRoot(this.container);
    }
    return this.container;
  }

  private show(props: any) {
    this.getContainer();
    this.root.render(React.createElement(Modal, props));
  }

  private close() {
    if (this.root) {
      this.root.unmount();
    }
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
      this.root = null;
    }
  }

  alert(message: string, title: string = 'Hinweis') {
    return new Promise<void>((resolve) => {
      this.show({
        type: 'info',
        title,
        message,
        onConfirm: () => {
          this.close();
          resolve();
        },
        onCancel: () => {
          this.close();
          resolve();
        }
      });
    });
  }

  success(message: string, title: string = 'Erfolgreich!') {
    return new Promise<void>((resolve) => {
      this.show({
        type: 'success',
        title,
        message,
        onConfirm: () => {
          this.close();
          resolve();
        },
        onCancel: () => {
          this.close();
          resolve();
        }
      });
    });
  }

  error(message: string, title: string = 'Fehler') {
    return new Promise<void>((resolve) => {
      this.show({
        type: 'error',
        title,
        message,
        onConfirm: () => {
          this.close();
          resolve();
        },
        onCancel: () => {
          this.close();
          resolve();
        }
      });
    });
  }

  warning(message: string, title: string = 'Warnung') {
    return new Promise<void>((resolve) => {
      this.show({
        type: 'warning',
        title,
        message,
        onConfirm: () => {
          this.close();
          resolve();
        },
        onCancel: () => {
          this.close();
          resolve();
        }
      });
    });
  }

  confirm(message: string, title: string = 'Bestätigung') {
    return new Promise<boolean>((resolve) => {
      this.show({
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          this.close();
          resolve(true);
        },
        onCancel: () => {
          this.close();
          resolve(false);
        },
        confirmText: 'Ja',
        cancelText: 'Nein'
      });
    });
  }
}

export const modalService = new ModalService();
