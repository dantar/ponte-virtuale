import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-game-html',
  templateUrl: './game-html.component.html',
  styleUrls: ['./game-html.component.scss']
})
export class GameHtmlComponent {

  @Input() url: string;
  @Output() clickable = new EventEmitter();

  loading: boolean;
  html: string;

  constructor(
    private repository: GameRepositoryService, 
    private shared: SharedDataService,
  ) {

  }

  ngOnInit() {
    this.refreshHtml();
  }

  private refreshHtml() {
    this.loading = true;
    this.repository.observeResource(this.shared.getGameResourceUrl(this.url))
    .subscribe(
      {
        next: svgsource => {
          this.html = this.shared.getReplaceResourceUrls(svgsource);
          this.loading = false;
        },
        error: error => {
          console.log(`problem with file ${this.url}`);
          this.loading = false;
        }
      }
    );
  }

}
