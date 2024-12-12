import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IfTypeOf } from 'src/app/services/if-type-of.service';
import { GamePlayStory, GameScenario } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-main-landing',
  templateUrl: './main-landing.component.html',
  styleUrls: ['./main-landing.component.scss']
})
export class MainLandingComponent implements OnInit, OnDestroy {

  @Inject(DOCUMENT) private document: Document

  private stylesheet?: HTMLLinkElement;
  private cssLinks: HTMLLinkElement[];

  pagename?: string;

  constructor(
    public shared: SharedDataService,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    ) {

  }

  ngOnInit(): void {
    this.cssLinks = [];
    if (this.shared.scenario) {
      this.initStylesheet(this.shared.scenario);
    } else {
      this.shared.scenarioReadyObs.subscribe((scenario) => {
        this.initStylesheet(scenario);
      });
    }
    this.route.params.subscribe(p => {
      if (p['page']) {
        this.pagename = p['page'];
      }
    });
  }

  private initStylesheet(scenario: GameScenario) { 
    IfTypeOf.build()
    .ifArray<string>(a => a.forEach(css => this.pushStylesheet(css)))
    .ifString(css => this.pushStylesheet(css))
    .of(scenario.stylesheet);
  }

  private pushStylesheet(cssUrl: string) { 
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

  public ngOnDestroy(): void {
    // Don't forget to remove style after component destroying
    this.cssLinks.forEach((link) => this.renderer.removeChild(document.head, link));
  }

  clickMarker(event: any) {
    console.log(event);
    this.shared.visitTappa(event.feature.id);  
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

  startGame() {
    this.shared.startGame();
  }

  qrcode(code: string) {
    this.shared.clearScanner();
    this.shared.qrCode(code);
  }

  handleScannerEvent(event: string) {
    switch (event) {
      case 'close':
      default:
        this.shared.clearScanner();
        break
    }
  }

}