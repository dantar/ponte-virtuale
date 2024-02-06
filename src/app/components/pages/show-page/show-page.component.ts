import { Component, Input, NgZone, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { GamePage } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';
import { Optional } from 'src/app/services/utils';

@Component({
  selector: 'app-show-page',
  templateUrl: './show-page.component.html',
  styleUrls: ['./show-page.component.scss']
})
export class ShowPageComponent implements OnInit, OnChanges {

  @Input() page: string;
  loading: boolean;
  html: string;

  constructor(
    private repository: GameRepositoryService, 
    public shared: SharedDataService,
    private ng: NgZone) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.refreshHtml();
  }

  ngOnInit() {
    this.refreshHtml();
  }

  private refreshHtml() {
    this.loading = true;
    const fullpage: GamePage = this.shared.getPage(this.page);
    this.repository.observeResource(this.shared.getGameResourceUrl(fullpage.url))
    .subscribe(
      {
        next: svgsource => {
          this.html = svgsource;
          this.loading = false;
        },
        error: error => {
          console.log(`problem with file ${fullpage.url}`);
          this.loading = false;
        }
      }
    );
  }

  handleClickable(event: any) {
    this.ng.run(() => {
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
        clickable.getAttribute('data-page'), 
        (page) => {
          this.chiudi();
          this.shared.showPage(page);
        }
      );
    });
  }

  chiudi() {
    this.shared.play.currentPage = undefined;
  }

}
