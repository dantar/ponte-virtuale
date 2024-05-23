import { Injectable } from '@angular/core';
import { Optional } from './utils';
import { SharedDataService } from './shared-data.service';
import { GameEventSubmitForm } from './ponte-virtuale.service';
import { LeafletSettingsService } from './leaflet-settings.service';
import { WebShareBuilder, WebShareService } from './web-share.service';

@Injectable({
  providedIn: 'root'
})
export class ClickableHandlerService {

  constructor(
    private shared: SharedDataService,
    private leaflet: LeafletSettingsService,
    private webshare: WebShareService,
  ) { }

  handleClickable(target: HTMLElement) {
    if (target) {
      const clickable = target.closest(".clickable");
      if (clickable) {
        this.doHandleClickable(clickable as HTMLElement);
      }
    }
  }

  private doHandleClickable(clickable: HTMLElement) {
    Optional.ifPresent(
      clickable.getAttribute('data-zoomto'), 
      (zoomto) => this.shared.fireZoomTo(zoomto as string)
    );
    Optional.ifPresent(
      clickable.getAttribute('data-action'), 
      (action) => this.shared.triggerAction(action as string)
    );
    Optional.ifPresent(
      clickable.getAttribute('data-submit'), 
      (submit) => {
        const split = (submit as string).split(':');
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
      (location) => {
        this.leaflet.takeMeTo(location as string);
      }
    );
    Optional.ifPresent(
      clickable.getAttribute('data-page'), 
      (page) => {
        this.shared.showPage(page as string);
      }
    );
    Optional.ifPresent(
      clickable.getAttribute('data-story'), 
      (story) => {
        this.shared.showStory(story as string);
      }
    );
    Optional.ifPresent(
      clickable.getAttribute('data-copy-snapshot'), 
      (attr) => {
        const element = document.querySelector(attr as string) as HTMLElement;
        if (element) {
          this.webshare.copySnapshot(element)
          .then(() => console.log('Copiato nella clipboard!'))
          .catch((error) => console.log('Errore clipboard snapshot', error));
        }
      }
    );

    const builder = new WebShareBuilder();
    Optional.ifPresent(
      clickable.getAttribute('data-webshare-snapshot'), 
      (attr) => {
        const element = document.querySelector(attr as string) as HTMLElement;
        if (element) {
          builder.setSnapShot(element);
        }
      }
    );
    Optional.ifPresent(
      clickable.getAttribute('data-webshare-text'), 
      (attr) => {
        builder.setText(attr as string);
      }
    );
    Optional.ifPresent(
      clickable.getAttribute('data-webshare-url'), 
      (attr) => {
        builder.setUrl(attr as string);
      }
    );
    if (builder.isValid()) {
      this.webshare.webShareData(builder);
    }
    
    Optional.ifPresent(
      clickable.getAttribute('data-scanner'), 
      (scanner) => {
        this.shared.showScanner(scanner as string);
      }
    );

  }

  handleTarget(target: HTMLElement, attribute: string, action: (s:string | null) => void) {
    if (target) {
      const clickable = target.closest(".clickable");
      if (clickable) {
        Optional.ifPresent(clickable.getAttribute(attribute), action);
      }
    }
  }

}
