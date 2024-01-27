import { Component, Input, OnInit } from '@angular/core';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { GamePlayStory } from 'src/app/services/ponte-virtuale.service';
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

  constructor(private repository: GameRepositoryService, public shared: SharedDataService) {}

  ngOnInit() {
    this.loading = true;
    this.repository.observeResource(this.shared.getGameResourceUrl(this.story.origin.html))
    .subscribe(
      {
        next: svgsource => {
          this.html = svgsource;
          this.loading = false;
        },
        error: error => {
          console.log(`problem with file ${this.story.origin.html}`);
          this.loading = false;
        }
      }
    );
  }

  handleClickable(event: any) {
    console.log('handleClickable', event);
    const target = event.target.closest(".clickable").getAttribute('data-target');
    if (target) {
      this.shared.triggerAction(target);
    }
  }

}
