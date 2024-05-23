import { Injectable } from '@angular/core';
import { toPng } from 'html-to-image';

@Injectable({
  providedIn: 'root'
})
export class WebShareService {

  webshareEnabled: boolean;
  clipboardEnabled: boolean;

  constructor() {
    this.webshareEnabled = navigator['share'] ? true : false;
    this.clipboardEnabled = navigator['clipboard'] ? true : false;
  }

  async webShareData(builder: WebShareBuilder): Promise<void> {
    if (builder.snapshot) {
      const blob = await this.htmlToCanvas(builder.snapshot);
      builder.data.files = [new File([blob], 'screenshot.png', { type: 'image/png' })];
    }
    await navigator.share(builder.data);
  }

  async webShareSnapshot(element: HTMLElement): Promise<void> {
    const blob = await this.htmlToCanvas(element);
    await this.blobToWebShare(blob);
  }

  async copySnapshot(element: HTMLElement): Promise<void> {
    const blob = await this.htmlToCanvas(element);
    await this.blobToClipboard(blob);
  }

  private async htmlToCanvas(element: HTMLElement): Promise<Blob> {
    const dataUrl = await toPng(element);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
  }

  private async blobToClipboard(blob: Blob): Promise<void> {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    console.log('Screenshot copied to clipboard.');
  }

  private async blobToWebShare(blob: Blob): Promise<void> {
    await navigator.share({
      title: 'Ponte virtuale web share',
      url: 'http://www.google.com',
      text: 'Questo è il testo da condividere e ha un accento!',
      files: [new File([blob], 'screenshot.png', { type: 'image/png' })]
    });
  }

}

export class WebShareBuilder {

  data: ShareData;
  snapshot: HTMLElement;

  constructor() {
    this.data = {};
  }

  setText(text: string): WebShareBuilder {
    if (text) {
      this.data.text = text;
    }
    return this;
  }

  setSnapShot(element: HTMLElement): WebShareBuilder {
    if (element) {
      this.snapshot = element;
    }
    return this;
  }

  setUrl(url: string): WebShareBuilder {
    if (url) {
      this.data.url = new URL(url).href;
    }
    return this;
  }

  isValid(): boolean {
    return !!(this.data.text || this.data.url || this.snapshot);
  }

}