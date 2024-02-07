import { Injectable } from '@angular/core';
import * as Leaflet from 'leaflet';
import { Observable, Subscriber } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeafletSettingsService {

  available: boolean;
  allowed: boolean;
  watchedposition: Observable<GeolocationPosition>;
  private watchid: number;

  observers: Subscriber<GeolocationPosition>[] = [];

  getMapOptions(): import("leaflet").MapOptions {
    return {
      layers: getLayers(),
      zoom: 5,
      center: new Leaflet.LatLng(43.530147, 16.488932)
    }
  }

  constructor() {
    this.available = "geolocation" in navigator;
    this.setAllowed(JSON.parse(localStorage.getItem('leaflet-allowed') || 'false'));
  }

  setAllowed(allowed: boolean) {
    this.allowed = allowed;
    localStorage.setItem('leaflet-allowed', String(this.allowed));
    this.initObservables();
  }

  allowWatch() {
    this.setAllowed(this.available);
    this.initObservables();
  }

  private initObservables() {
    const service = this;
    if (this.allowed) {
      this.watchedposition = new Observable(observer => {
        const onSuccess:PositionCallback = (pos: GeolocationPosition) => {
            observer.next(pos);
        };
        const onError:PositionErrorCallback = (error) => {
            if (error && error.code === error.PERMISSION_DENIED) {
              service.allowed = false;
            }
            observer.error(error);
        };
        //const options:PositionOptions = this.locationOptions();
        const watcher:number = navigator.geolocation.watchPosition(onSuccess, onError);
        return () => {
            navigator.geolocation.clearWatch(watcher);
        };
      });
    }
  }

  async getPosition(): Promise<GeolocationPosition> {
    const options: PositionOptions = {};
    return new Promise((resolve, reject) => 
    navigator.geolocation.getCurrentPosition(resolve, (reason) => {
      if (reason && reason.code === reason.PERMISSION_DENIED) {
        this.setAllowed(false);
      }
      reject(reason);
    }, options));
  }

}

export const getLayers = (): Leaflet.Layer[] => {
  return [
    new Leaflet.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: ''} as Leaflet.TileLayerOptions),
  ] as Leaflet.Layer[];
};

export { Leaflet };

export class MapFeature {
  id: string;
  name: string;
  marker: Leaflet.Marker;
}