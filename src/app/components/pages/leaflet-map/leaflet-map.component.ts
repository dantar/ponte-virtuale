import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { GeoJSONOptions, Map, Marker, PointExpression } from 'leaflet';
import { Observable, Subscription } from 'rxjs';
import { IfTypeOf } from 'src/app/services/if-type-of.service';
import { LeafletSettingsService, Leaflet, MapFeature } from 'src/app/services/leaflet-settings.service';
import { GameCondition, GameLayerIcon, GameLayerMap, MapFeaturePolyline, MapLocation } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';
import { Optional } from 'src/app/services/utils';

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss']
})
export class LeafletMapComponent implements OnInit, OnDestroy {

  enabled: boolean;
  options: Leaflet.MapOptions;
  tracker: Subscription;
  positionMarker: Marker;
  map: Map;
  featuresById: {[id: string]: MapFeature};
  polylinesById: {[id: string]: MapFeaturePolyline};

  layers: Leaflet.Layer[];

  @Input() layer: GameLayerMap;
  @Output() clickMarker = new EventEmitter();

  allicons: {[id:string]: Leaflet.Icon};
  subscriptions: Subscription[];

  constructor(
    public leaflet: LeafletSettingsService,
    private changes: ChangeDetectorRef,
    private shared: SharedDataService,
    private ng: NgZone,
  ) {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  ngOnInit(): void {
    this.subscriptions = [];
    this.allicons = {};
    this.featuresById = {};
    this.polylinesById = {};
    this.getLayers();
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
    this.subscriptions.push(
      this.shared.zoomMapToObs.subscribe(location => this.zoomToFeature(location))
    );
    this.subscriptions.push(
      this.leaflet.takeMeToObs.subscribe(location => this.takeMeToFeature(location))
    );
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
    if (location in this.featuresById) {
      const feature = this.featuresById[location];
      this.fitBounds(feature.marker);
    } else if (location in this.polylinesById) {
      const p = this.polylinesById[location];
      const markers: Marker<any>[] = [];
      const bb = new BoundingBoxFinder();
      const ito = IfTypeOf.build()
      .ifString(id => markers.push(this.featuresById[id as string].marker))
      .ifArray<number>(ll => bb.oneMoreLatLon(ll));
      p.polyline.forEach(c => ito.of(c));
      bb.addMarkers(markers);
      this.fitBounds(...markers);
    } else {
      switch (location) {
        case 'gps':
          if (this.positionMarker) {
            this.fitBounds(this.positionMarker);
          } else {
            this.leaflet.allowWatch();
            this.subscribewatch((m) => this.fitBounds(m));
          }
          break;
        case 'all-features':
          this.fitBounds(... Object.keys(this.featuresById).map(k => this.featuresById[k].marker));
          break;
        case 'gps-and-all-features':
          if (this.positionMarker) {
            this.fitBounds(this.positionMarker, ... Object.keys(this.featuresById).map(k => this.featuresById[k].marker));
          } else {
            this.leaflet.allowWatch();
            this.subscribewatch((m) => this.fitBounds(m, ... Object.keys(this.featuresById).map(k => this.featuresById[k].marker)));
          }
          break;
        default:
          break;
      }
    }
  }

  fitBounds(...markers: Marker[]) {
    this.map.fitBounds(Leaflet.latLngBounds(markers.map(m => m.getLatLng())));
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

  private getLayers(): void {
    console.log('getLayers!');
    let visibles: string[] = [];
    this.layer.features
    .filter(f => MapFeaturePolyline.isPolyline(f as MapFeaturePolyline))
    .forEach(f => this.polylinesById[f.id] = f as MapFeaturePolyline);
    const markers: Leaflet.Layer[] = this.layer.features
    .filter(f => f.pos)
    .filter(f => !f.condition || this.shared.checkCondition(f.condition)) // FIXME: fix this: won't be called! use ConditionEvaluator
    .map(f => {
      visibles.push(f.id);
      return this._makeFeature(f).marker
    })
    ;
    this.layer.features
    .map(f => f as MapFeaturePolyline)
    .filter(f => f.polyline)
    .forEach(f => {
      const mylines = {
        "type": "LineString", 
        "coordinates": this.getPolylineCoordinates(f, visibles)
      } as GeoJSON.GeoJsonObject;
      const myStyle = f.style || {
          "color": "#ff7800",
          "weight": 12,
          "opacity": 0.65
      };
      //console.log('polyline', mylines);
      //const gjlayer = Leaflet.geoJSON([mylines], myStyle as GeoJSONOptions).addTo(map);
      const gjlayer = Leaflet.geoJSON([mylines], myStyle as GeoJSONOptions);
      markers.push(gjlayer);
    });
    // if (this.positionMarker) {
    //   markers.push(this.positionMarker);
    // }
    //console.log("Markers!", markers);
    this.layers = markers;
    //return markers;
  }

  private getPolylineCoordinates(f: MapFeaturePolyline, visibles: string[]): number[][] {
    let result: number[][] = [];
    let resolver = IfTypeOf.build()
    .ifString((id:string) => {
      if (visibles.includes(id)) {
        let ll = this.layer.features[this.layer.features.map(f=>f.id).indexOf(id)].pos;
        if (ll) {
          result.push([ll[1], ll[0]]);
        }
      }
    })
    .ifArray((ll: number[]) => result.push([ll[1], ll[0]]));
    f.polyline.map(i => resolver.of(i));
    return result;
  }

  subscribewatch(callback?: (m:Marker) => void) {
    console.log('subscribe moving');
    if (this.leaflet.watchedposition) {
      this.tracker = this.leaflet.watchedposition.subscribe((aa) => {
        console.log('moving...', aa);
        const latlng = new Leaflet.LatLng(aa.coords.latitude, aa.coords.longitude);
        if (this.positionMarker) {
          this.positionMarker.setLatLng(latlng);
        } else {
          // create marker
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
          this.positionMarker = Leaflet.marker(latlng, markeropts);
          this.layers.push(this.positionMarker);          
          if (callback) {
            callback(this.positionMarker);
          }
        }
        this.shared.detectUserAtLatLon(aa.coords.latitude, aa.coords.longitude);
        this.changes.detectChanges();
      });
      this.subscriptions.push(this.tracker);
    }
  }

  enableGps() {
    this.leaflet.allowWatch();
    this.subscribewatch();
  }

  onMapReady(map: Map) {
    console.log('onMapReady', this.map);
    this.map = map;
    this.map.fitBounds(
      //this.getLayers()
      this.layers
      .filter(l => l instanceof Marker)
      .map(m => (m as Marker).getLatLng())
      .map(ll => [ll.lat,ll.lng]));
  }

  handleMenuClickable(event: any) {
    this.ng.run(() => {

      console.log('handleClickable', event);
      const clickable = event.target.closest(".clickable");
      Optional.ifPresent(
        clickable.getAttribute('data-zoomto'), 
        (zoomto) => this.shared.fireZoomTo(zoomto)
      );
      Optional.ifPresent(
        clickable.getAttribute('data-page'), 
        (page) => {
          this.shared.showPage(page);
        }
      );
    });
  }

}

class BoundingBoxFinder {

  ul?: Leaflet.LatLngTuple;
  lr?: Leaflet.LatLngTuple;

  constructor() {
  }

  oneMoreLatLon(ll: number[]): void {
    this.ul = this.ul ? [
      this.ul[0] < ll[0] ? ll[0]: this.ul[0],
      this.ul[1] < ll[1] ? ll[1]: this.ul[1],
    ]: [ll[0], ll[1]];
    this.lr = this.lr ? [
      this.lr[0] > ll[0] ? ll[0]: this.lr[0],
      this.lr[1] > ll[1] ? ll[1]: this.lr[1],
    ]: [ll[0], ll[1]];
  }

  addMarkers(markers: Marker<any>[]) {
    if (this.ul && this.lr) {
      markers.push(Leaflet.marker(this.ul));
      markers.push(Leaflet.marker(this.lr));
    }
  }

}
