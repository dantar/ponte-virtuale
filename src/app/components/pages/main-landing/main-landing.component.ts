import { Component, OnInit } from '@angular/core';
import { GamePlayStory } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-main-landing',
  templateUrl: './main-landing.component.html',
  styleUrls: ['./main-landing.component.scss']
})
export class MainLandingComponent implements OnInit {

  constructor(
    public shared: SharedDataService,
    ) {

  }

  ngOnInit(): void {
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