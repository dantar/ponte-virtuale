import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Leaflet, MapFeature } from 'src/app/services/leaflet-settings.service';
import { GameLayer, GameLayerMap, GamePage, GamePlayStory, MapLocation } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-main-landing',
  templateUrl: './main-landing.component.html',
  styleUrls: ['./main-landing.component.scss']
})
export class MainLandingComponent implements OnInit {

  features: MapFeature[];
  currentfeature: MapFeature;
  travelled: number;

  options: Leaflet.MarkerOptions = {
    icon: Leaflet.icon({iconUrl: './assets/pin-red-0-0.svg', iconSize: [30, 30]})
  };
  popup: Leaflet.Popup = Leaflet.popup().setContent("uno due tre");

  constructor(
    private changes: ChangeDetectorRef,
    public shared: SharedDataService,
    private ng: NgZone,
    ) {

  }

  ngOnInit(): void {
  }

  wrapMapFeatures(shown: ShownGameLayer) {
    const layer = shown.layer as GameLayerMap;
    return layer.features.map(f => this._makeFeature(f));
  }

  private _makeFeature(loc: MapLocation): MapFeature {
    let feature = {id: loc.id, marker: this._makeMarker(loc), name: loc.name} as MapFeature;
    feature.marker.on('click', this._clickFeature(feature));
    return feature;
  }

  private _makeMarker(loc: MapLocation): Leaflet.Marker {
    return Leaflet.marker(new Leaflet.LatLng(loc.pos ? loc.pos[0] : loc.lat, loc.pos? loc.pos[1] : loc.lon), this.options);
  }

  private _clickFeature(feature: MapFeature): Leaflet.LeafletMouseEventHandlerFn {
    return (event: Leaflet.LeafletMouseEvent) => {
      this.ng.run(() => {
        console.log(event, feature, this);
        if (this.currentfeature) {
          this.travelled = feature.marker.getLatLng().distanceTo(this.currentfeature.marker.getLatLng());
        }
        this.currentfeature = feature;
        this.shared.visitTappa(feature.id);  
      });
    };
  }

  getShownGameLayers(): ShownGameLayer[] {
    if (!this.shared.scenario.layers) {
      return [];
    }
    return this.shared.scenario.layers
    .filter(l => l.code != 'map')
    .map(l => this._inflateLayer(l));
  }

  private _inflateLayer(l: GameLayer): ShownGameLayer {
    if (typeof l.page === 'string') {
      return {layer: l, page: this.shared.findPage(l.page as string)};
    } else {
      return {layer: l, page: l.page as GamePage}
    }
  }

  getFirstUnreadStory(): GamePlayStory[] {
    if (this.shared.play.story) {
      const unread = this.shared.play.story.filter(s => !s.published);
      console.log('unread', unread);
      if (unread.length >= 0) {
        return [unread[0]];
      }
    }
    return [];
  }

  private _inflateStory(story: GamePlayStory): ShownGamePlayStory {
    return {story: story};
  }

  startGame() {
    this.shared.startGame();
  }

  thereIsOneMapLayer(): boolean {
    return this.shared.scenario.layers.filter(l => l.code == 'map').length > 0;
  }

  getMapOnlyLayer(): ShownGameLayer {
    return this._inflateLayer(
      this.shared.scenario.layers.filter(l => l.code == 'map')[0]
    )
    ;

  }

  okStory(story: GamePlayStory) {
    story.published = true;
    this.shared.savePlay();
  }

}


class ShownGameLayer {
  layer: GameLayer;
  page: GamePage;
}

class ShownGamePlayStory {
  story: GamePlayStory;
}