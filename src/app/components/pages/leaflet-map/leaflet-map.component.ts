import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { GeoJSONOptions, Map, Marker, PointExpression } from 'leaflet';
import { Subscription } from 'rxjs';
import { IfTypeOf } from 'src/app/services/if-type-of.service';
import { LeafletSettingsService, Leaflet, MapFeature } from 'src/app/services/leaflet-settings.service';
import { GameCondition, GameLayerIcon, GameLayerMap, MapFeaturePolyline, MapLocation } from 'src/app/services/ponte-virtuale.service';
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
  featuresById: {[id: string]: MapFeature};

  @Input() layer: GameLayerMap;
  @Output() clickMarker = new EventEmitter();

  allicons: {[id:string]: Leaflet.Icon};


  constructor(
    public leaflet: LeafletSettingsService,
    private changes: ChangeDetectorRef,
    private shared: SharedDataService,
    private ng: NgZone,
  ) {
  }

  ngOnInit(): void {
    this.allicons = {};
    this.featuresById = {};
    console.log('map is reset');
    this.subscribewatch();
    this.subscribezoom();
    this.options = this.leaflet.getMapOptions();

    this.allicons['gps-fallback'] = Leaflet.icon({
      iconUrl: './assets/pin.svg', 
      iconAnchor: [15, 15],
      className: `icon-gps-fallback`
    });

  }

  subscribezoom() {
    this.shared.zoomMapToObs.subscribe(location => this.zoomToFeature(location));
    this.leaflet.takeMeToObs.subscribe(location => this.takeMeToFeature(location));
  }

  takeMeToFeature(location: string): void {
    const feature = this.featuresById[location];
    if (window && feature) {
      const marker = feature.marker;
      var locLatLng = marker.getLatLng();
      let url: string;
      if (this.positionMarker) {
        var posLatLng = this.positionMarker.getLatLng();
        url = `https://www.google.com/maps/dir/${posLatLng.lat},${posLatLng.lng}/${locLatLng.lat},${locLatLng.lng}`;
      } else {
        url = `https://www.google.com/maps/?q=${locLatLng.lat},${locLatLng.lng}`;
      }
      const w = window.open(url, '_blank');
      if (w) {
        w.focus();
      }
    }
  }

  zoomToFeature(location: string): void {
    const map = this.map;
    const feature = this.featuresById[location];
    if (feature) {
      const marker = feature.marker;
      var latLngs = [ marker.getLatLng() ];
      var markerBounds = Leaflet.latLngBounds(latLngs);
      map.fitBounds(markerBounds);
      this.changeFeatureIcon(feature);
    }
  }

  changeFeatureIcon(feature: MapFeature) {
    // const icon = Leaflet.icon({
    //   iconUrl: './assets/gps.svg', 
    //   iconSize: [30,30], 
    //   iconAnchor: [15, 15]
    // });
    //feature.marker.setIcon(icon);
    feature.marker.setIcon(this.allicons['gps-fallback']);
    feature.marker.getIcon();
  }

  private _getGameLayerIcon(loc: MapLocation): GameLayerIcon {
    const found: GameLayerIcon[] = [];
    const handleIcon = new IfTypeOf()
    .ifString( (s) => found.push(this._getGameLayerIconById(s)) )
    .ifObject( (o) => found.push(o as GameLayerIcon) );
    handleIcon.of(loc.icon);
    //if (loc.icons || loc.id==='freedom-park-locomotive') 
    new IfTypeOf()
    .ifArray<{condition: GameCondition, icon: string | GameLayerIcon}>( (a) => {
      for (let index = 0; index < a.length; index++) {
        const i = a[index];
        if (!i.condition || this.shared.checkCondition(i.condition)) {
          handleIcon.of(i.icon);
          break;
        }
      }
    })
    .of(loc.icon);
    return found.pop() as GameLayerIcon;
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
        iconAnchor: i.anchor as PointExpression || [15, 15],
        className: `icon-${loc.id}`
      });
    } else {
      markeropts.icon = Leaflet.icon({
        iconUrl: './assets/pin.svg', 
        iconAnchor: [15, 15],
        className: `icon-${loc.id}`
      });
    }
    const marker = Leaflet.marker(new Leaflet.LatLng(loc.pos ? loc.pos[0] : loc.lat, loc.pos? loc.pos[1] : loc.lon), markeropts);
    const feature = {
      id: loc.id, 
      marker: marker, 
      name: loc.name
    } as MapFeature;
    feature.marker.on('click', this._clickFeature(feature));
    this.featuresById[loc.id] = feature;
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
        const markeropts: Leaflet.MarkerOptions = {};
        if (this._getIconIndex('gps') >= 0) {
          const i = this._getGameLayerIconById('gps');
          markeropts.icon = Leaflet.icon({
            iconUrl: this.shared.getGameResourceUrl(i.url), 
            iconSize: i.size as PointExpression || [30,30], 
            iconAnchor: i.anchor as PointExpression || [15, 15]
          });
        } else {
          markeropts.icon = Leaflet.icon({
            iconUrl: './assets/gps.svg', 
            iconSize: [30,30], 
            iconAnchor: [15, 15]
          });
        }
        this.positionMarker = Leaflet.marker(new Leaflet.LatLng(aa.coords.latitude, aa.coords.longitude), markeropts);
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

    this.layer.features
    .map(f => f as MapFeaturePolyline)
    .filter(f => f.polyline)
    .forEach(f => {
      const mylines = {
        "type": "LineString", 
        "coordinates": f.polyline
          .map(id => this.layer.features[this.layer.features.map(f=>f.id).indexOf(id)].pos)
          .map(p => p as number[])
          .map(p => [p[1], p[0]])
      } as GeoJSON.GeoJsonObject;
      const myStyle = f.style || {
          "color": "#ff7800",
          "weight": 12,
          "opacity": 0.65
      };
      const gjlayer = Leaflet.geoJSON([mylines], myStyle as GeoJSONOptions).addTo(map);
    });

  }

}

