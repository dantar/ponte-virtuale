import { Component, Input, OnInit } from '@angular/core';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { GameEffectStory, GamePlayStory } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';
import { Optional } from 'src/app/services/utils';

@Component({
  selector: 'app-show-story',
  templateUrl: './show-story.component.html',
  styleUrls: ['./show-story.component.scss']
})
export class ShowStoryComponent implements OnInit {

  @Input() story: GamePlayStory;

  loading: boolean;
  html: string;

  constructor(private repository: GameRepositoryService, public shared: SharedDataService) {}

  ngOnInit() {
  }

  handleClickable(event: any) {
    console.log('handleClickable', event);
    const clickable = event.target.closest(".clickable");
    Optional.ifPresent(
      clickable.getAttribute('data-action'), 
      (action) => this.shared.triggerAction(action)
    );
    Optional.ifPresent(
      clickable.getAttribute('data-close'), 
      (close) => this.chiudi()
    );
    Optional.ifPresent(
      clickable.getAttribute('data-more'), 
      (more) => {
        this.chiudi();
        this.shared.resolveEffect({story: more} as GameEffectStory);
      }
    );
    Optional.ifPresent(
      clickable.getAttribute('data-page'), 
      (page) => {
        this.shared.showPage(page);
      }
    );
  }

  chiudi() {
    this.story.published = true;
    this.shared.savePlay();
  }

}
