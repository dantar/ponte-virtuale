import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ClickableHandlerService } from 'src/app/services/clickable-handler.service';
import { LeafletSettingsService } from 'src/app/services/leaflet-settings.service';
import { GamePage } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-show-page',
  templateUrl: './show-page.component.html',
  styleUrls: ['./show-page.component.scss']
})
export class ShowPageComponent implements OnInit, OnChanges {

  @Input() page: string;
  fullpage: GamePage;

  constructor(
    public leaflet: LeafletSettingsService,
    public shared: SharedDataService,
    public clickable: ClickableHandlerService,
  ) 
  {}

  ngOnChanges(changes: SimpleChanges): void {
    this.refreshHtml();
  }

  ngOnInit() {
    this.refreshHtml();
  }

  private refreshHtml() {
    this.fullpage = this.shared.getPage(this.page);
    const fundamentals = {
      id: this.fullpage.id,
      uri: document.baseURI,
    };
    if (this.fullpage.data) {
      this.fullpage.data = {...fundamentals, ...this.fullpage.data};
    } else {
      this.fullpage.data = fundamentals;
    }
  }

  handleClickable(event: any) {
    this.clickable.handleClickable(event.target);
    this.clickable.handleTarget(event.target, 'data-close', (a) => this.chiudi());
  }

  chiudi() {
    this.shared.closePage();
  }

}
