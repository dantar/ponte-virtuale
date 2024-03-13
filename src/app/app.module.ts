import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { AppComponent } from './app.component';
import { MainLandingComponent } from './components/pages/main-landing/main-landing.component';
import { AnimateComponent } from './components/gui/animate/animate.component';
import { SvgLayerComponent } from './components/pages/svg-layer/svg-layer.component';
import { SafePipe } from './pipes/safe.pipe';
import { LeafletMapComponent } from './components/pages/leaflet-map/leaflet-map.component';
import { ShowStoryComponent } from './components/pages/show-story/show-story.component';
import { RenderHtmlComponent } from './components/gui/render-html/render-html.component';
import { GameConfigComponent } from './components/pages/game-config/game-config.component';
import { ShowPageComponent } from './components/pages/show-page/show-page.component';
import { PlayNewGameComponent } from './components/pages/play-new-game/play-new-game.component';
import { GameHtmlComponent } from './components/gui/game-html/game-html.component';

@NgModule({
  declarations: [
    AppComponent,
    MainLandingComponent,
    AnimateComponent,
    SvgLayerComponent,
    SafePipe,
    LeafletMapComponent,
    ShowStoryComponent,
    RenderHtmlComponent,
    GameConfigComponent,
    ShowPageComponent,
    PlayNewGameComponent,
    GameHtmlComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    LeafletModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
