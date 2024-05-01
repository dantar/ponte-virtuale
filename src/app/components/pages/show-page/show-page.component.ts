import { Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { LeafletSettingsService } from 'src/app/services/leaflet-settings.service';
import { GameEventSubmitForm, GamePage } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';
import { Optional } from 'src/app/services/utils';

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
    if (this.fullpage.data) {
      this.fullpage.data = {...{id: this.fullpage.id}, ...this.fullpage.data};
    } else {
      this.fullpage.data = {id: this.fullpage.id};
    }
  }

  handleClickable(event: any) {
    const clickable = event.target.closest(".clickable");
    Optional.ifPresent(
      clickable.getAttribute('data-zoomto'), 
      (zoomto) => this.shared.fireZoomTo(zoomto)
    );
    Optional.ifPresent(
      clickable.getAttribute('data-action'), 
      (action) => this.shared.triggerAction(action)
    );
    Optional.ifPresent(
      clickable.getAttribute('data-submit'), 
      (submit:string) => {
        const split = submit.split(':');
        const selector = split.pop() as string;
        const tag = split.pop() as string;
        const form = document.querySelectorAll(selector);
        const event = new GameEventSubmitForm();
        event.tag = tag;
        form.forEach((element) => {
          if (element instanceof HTMLInputElement) {
            event.form[element.name || 'input'] = element.value;
          }
        });
        this.shared.runEvent(event);
      }
    );
    Optional.ifPresent(
      clickable.getAttribute('data-takemeto'), 
      (location:string) => {
        this.leaflet.takeMeTo(location);
      }
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
    Optional.ifPresent(
      clickable.getAttribute('data-story'), 
      (story) => {
        this.shared.showStory(story);
      }
    );
    Optional.ifPresent(
      clickable.getAttribute('data-scanner'), 
      (scanner) => {
        this.shared.showScanner(scanner);
      }
    );
  }

  chiudi() {
    this.shared.play.currentPage = undefined;
    this.shared.savePlay();
  }

}
