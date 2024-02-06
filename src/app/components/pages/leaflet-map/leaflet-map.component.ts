import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { GeoJSONOptions, Map, Marker, PointExpression } from 'leaflet';
import { Subscription } from 'rxjs';
import { LeafletSettingsService, Leaflet, MapFeature } from 'src/app/services/leaflet-settings.service';
import { GameLayerIcon, GameLayerMap, MapFeaturePolyline, MapLocation } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

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
  map: Map;

  @Input() layer: GameLayerMap;
  @Output() clickMarker = new EventEmitter();


  constructor(
    public leaflet: LeafletSettingsService,
    private changes: ChangeDetectorRef,
    private shared: SharedDataService,
    private ng: NgZone,
  ) {
  }

  ngOnInit(): void {
    console.log('map is reset');
    this.subscribewatch();
    this.options = this.leaflet.getMapOptions();
  }

  private _getGameLayerIcon(loc: MapLocation): GameLayerIcon {
    if (typeof loc.icon === 'string') {
      const index = this.layer.icons.map(i => i.id).indexOf(loc.icon);
      return this.layer.icons[index];
    }
    return loc.icon as GameLayerIcon;
  }

  private _getGameLayerIconById(id: string): GameLayerIcon {
    return this.layer.icons[this._getIconIndex(id)];
  }

  private _getIconIndex(id: string) {
    return this.layer.icons.map(i => i.id).indexOf(id);
  }

  private _makeFeature(loc: MapLocation): MapFeature {
    const markeropts: Leaflet.MarkerOptions = {};
    if (loc.icon) {
      const i = this._getGameLayerIcon(loc);
      markeropts.icon = Leaflet.icon({
        iconUrl: this.shared.getGameResourceUrl(i.url), 
        iconSize: i.size as PointExpression || [30,30], 
        iconAnchor: i.anchor as PointExpression || [15, 15]
      });
    } else {
      markeropts.icon = Leaflet.icon({iconUrl: './assets/pin.svg', iconAnchor: [15, 15]});
    }
    const marker = Leaflet.marker(new Leaflet.LatLng(loc.pos ? loc.pos[0] : loc.lat, loc.pos? loc.pos[1] : loc.lon), markeropts);
    const feature = {
      id: loc.id, 
      marker: marker, 
      name: loc.name
    } as MapFeature;
    feature.marker.on('click', this._clickFeature(feature));
    return feature;
  }

  private _clickFeature(feature: MapFeature): Leaflet.LeafletMouseEventHandlerFn {
    return (event: Leaflet.LeafletMouseEvent) => {
      this.ng.run(() => {
        this.clickMarker.emit({feature: feature, event: event});
      });
    };
  }

  getLayers(): Marker[] {
    const markers = this.layer.features
    .filter(f => f.pos)
    .map(f => this._makeFeature(f).marker)
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
        this.positionMarker = Leaflet.marker(new Leaflet.LatLng(aa.coords.latitude, aa.coords.longitude), {
          icon: Leaflet.icon({iconUrl: this._getIconIndex('gps') >= 0
          ? this.shared.getGameResourceUrl(this._getGameLayerIconById('gps').url)
          : './assets/gps.svg'
        })
          
        });
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

    var myStyle = {
        "color": "#ff7800",
        "weight": 12,
        "opacity": 0.65
    };
    const myLines = this.layer.features
    .map(f => f as MapFeaturePolyline)
    .filter(f => f.polyline)
    .map(f => (
      {
        "type": "LineString", 
        "coordinates": f.polyline
          .map(id => this.layer.features[this.layer.features.map(f=>f.id).indexOf(id)].pos)
          .map(p => p as number[])
          .map(p => [p[1], p[0]])
      }
      )
    );
    const gjlayer = Leaflet.geoJSON(myLines as GeoJSON.GeoJsonObject[], myStyle as GeoJSONOptions).addTo(map);

  }

}
