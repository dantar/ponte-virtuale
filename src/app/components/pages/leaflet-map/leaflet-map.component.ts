import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { Map, Marker } from 'leaflet';
import { Subscription } from 'rxjs';
import { LeafletSettingsService, Leaflet, MapFeature } from 'src/app/services/leaflet-settings.service';

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss']
})
export class LeafletMapComponent implements OnInit {

  enabled: boolean;
  options: Leaflet.MapOptions;
  tracker: Subscription;
  positionMarker: Marker;
  @Input() features: MapFeature[];
  map: Map;
  //@ViewChild('leaflet') leafletitem: LeafletCo


  constructor(
    public leaflet: LeafletSettingsService,
    private changes: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
    console.log('map is reset');
    this.subscribewatch();
    this.options = this.leaflet.getMapOptions();
  }

  getLayers(): Marker[] {
    let markers = this.features
    .map(f => f.marker)
    ;
    if (this.positionMarker) {
      markers.push(this.positionMarker);
    }
    return markers;
  }

  subscribewatch() {
    console.log('subscribe moving');
    if (this.leaflet.watchedposition) {
      this.tracker = this.leaflet.watchedposition.subscribe((aa) => {
        console.log('moving...', aa);
        this.positionMarker = Leaflet.marker(new Leaflet.LatLng(aa.coords.latitude, aa.coords.longitude));
        this.changes.detectChanges();
      });
    }
  }

  enableGps() {
    this.leaflet.allowWatch();
    this.subscribewatch();
  }

  onMapReady(map: Map) {
    console.log('onMapReady', this.map);
    this.map = map;
    this.map.fitBounds(this.getLayers().map(m => m.getLatLng()).map(ll => [ll.lat,ll.lng]));
  }

}
