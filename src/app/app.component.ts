import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { SharedDataService } from './services/shared-data.service';
import { CameraSettingsService } from './services/camera-settings.service';
import { Router } from '@angular/router';
import { IfTypeOf } from './services/if-type-of.service';
import { GameScenario } from './services/ponte-virtuale.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Ponte Virtuale';

  private stylesheet?: HTMLLinkElement;
  private cssLinks: HTMLLinkElement[];
  cssHtml: string[];

  constructor(
    public shared: SharedDataService,
    private camera: CameraSettingsService,
    private router: Router,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    this.cssLinks = [];
    this.cssHtml = [];
    this.shared.scenarioReadyObs.subscribe((scenario) => {
      this.startOrResumePlay();
    });
    this.shared.initGame();
    this.camera.initSettings();
  }

  public ngOnDestroy(): void {
    // Don't forget to remove style after component destroying
    this.cssLinks.forEach((link) => this.renderer.removeChild(document.head, link));
  }

  clickMarker(event: any) {
    console.log(event);
    this.shared.visitTappa(event.feature.id);  
  }

  startGame() {
    this.shared.startGame();
  }

  private initStylesheet(scenario: GameScenario) { 
    IfTypeOf.build()
    .ifArray<string>(a => a.forEach(css => this.pushStylesheet(css)))
    .ifString(css => this.pushStylesheet(css))
    .of(scenario.stylesheet);
  }

  private pushStylesheet(cssUrl: string) { 
    if (cssUrl.endsWith('.html')) {
      this.pushStylesheetAsHtml(cssUrl);
    } else {
      this.pushStylesheetAsLink(cssUrl);
    }
  }

  private pushStylesheetAsLink(cssUrl: string) { 
    // Create a link element via Angular's renderer to avoid SSR troubles
    const link = this.renderer.createElement('link') as HTMLLinkElement;
    // Add the style to the head section
    this.renderer.appendChild(document.head, link);
    // Set type of the link item and path to the css file
    this.renderer.setProperty(link, 'rel', 'stylesheet');
    this.renderer.setProperty(link, 'href', this.shared.getGameResourceUrl(cssUrl));
    this.renderer.setProperty(link, 'crossorigin', 'anonymous');
    this.cssLinks.push(link);
  }

  private pushStylesheetAsHtml(cssUrl: string) { 
    this.cssHtml.push(cssUrl);
  }

  private startOrResumePlay() {
    if (! this.shared.play) {
      this.shared.startGame();
    }
    if (this.shared.scenario) {
      this.initStylesheet(this.shared.scenario);
    } else {
      this.shared.scenarioReadyObs.subscribe((scenario) => {
        this.initStylesheet(scenario);
      });
    }
    if (this.shared.play.currentPage) {
      this.router.navigate(['page', this.shared.play.currentPage]);
    } else {
      this.router.navigate(['']);
    }
  }

}
