import { Component, Input, OnInit } from '@angular/core';
import { ClickableHandlerService } from 'src/app/services/clickable-handler.service';
import { GameEffectStory, GamePlayStory } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-show-story',
  templateUrl: './show-story.component.html',
  styleUrls: ['./show-story.component.scss']
})
export class ShowStoryComponent implements OnInit {

  @Input() story: GamePlayStory;

  loading: boolean;
  html: string;

  constructor(
    public shared: SharedDataService,
    private clickable: ClickableHandlerService,
    ) {}

  ngOnInit() {
  }

  handleClickable(event: any) {
    this.clickable.handleClickable(event.target);
    this.clickable.handleTarget(event.target, 'data-close', (a) => this.chiudi());
    this.clickable.handleTarget(event.target, 'data-more', (a) => {
      this.chiudi();
      this.shared.resolveEffect({story: a as string} as GameEffectStory);
    });
  }

  chiudi() {
    this.story.published = true;
    this.shared.savePlay();
  }

}
