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
export class MainLandingComponent implements OnInit {

  @Inject(DOCUMENT) private document: Document

  pagename?: string;

  constructor(
    public shared: SharedDataService,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    ) {
      console.log('MainLandingComponent constructor');
  }

  ngOnInit(): void {
    console.log('MainLandingComponent ngOnInit');
    this.route.params.subscribe(p => {
      if (p['page']) {
        this.pagename = p['page'];
      }
    });
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