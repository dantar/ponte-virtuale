import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CameraSettingsService {

  settings: CameraSettings;

  constructor() { }

  initSettings() {
    let s = localStorage.getItem('ponte-virtuale-camera-settings');
    if (s) {
      this.settings = JSON.parse(s) as CameraSettings;
    } else {
      this.settings = {}
    }
  }

  saveQrDeviceId(deviceId: string) {
    this.settings.qrDeviceId = deviceId;
    localStorage.setItem('ponte-virtuale-camera-settings', JSON.stringify(this.settings));
  }

  qrDeviceId(): string|undefined {
    return this.settings.qrDeviceId;
  }

}

export class CameraSettings {
  qrDeviceId?: string;
}
