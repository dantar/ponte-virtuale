import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { GamePlayStory, GameScenario } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-main-landing',
  templateUrl: './main-landing.component.html',
  styleUrls: ['./main-landing.component.scss']
})
export class MainLandingComponent implements OnInit, OnDestroy {

  stylesheetUrl: string;
  @Inject(DOCUMENT) private document: Document

  private stylesheet?: HTMLLinkElement;

  constructor(
    public shared: SharedDataService,
    private renderer: Renderer2,
    ) {

  }

  ngOnInit(): void {
    if (this.shared.scenario) {
      this.initStylesheet(this.shared.scenario);
    } else {
      this.shared.scenarioReadyObs.subscribe((scenario) => {
        this.initStylesheet(scenario);
      });
    }
  }

  private initStylesheet(scenario: GameScenario) { 
    if (scenario.stylesheet) {
      // Create a link element via Angular's renderer to avoid SSR troubles
      this.stylesheet = this.renderer.createElement('link') as HTMLLinkElement;
      // Add the style to the head section
      this.renderer.appendChild(document.head, this.stylesheet);
      // Set type of the link item and path to the css file
      this.renderer.setProperty(this.stylesheet, 'rel', 'stylesheet');
      this.renderer.setProperty(this.stylesheet, 'href', this.shared.getGameResourceUrl(scenario.stylesheet));
    }     
  }

  public ngOnDestroy(): void {
    // Don't forget to remove style after component destroying
    this.renderer.removeChild(document.head, this.stylesheet);
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

}