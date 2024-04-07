import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GameRepositoryService } from './game-repository.service';
import { SharedDataService } from './shared-data.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HtmlTemplatesService {

  constructor(
    private repository: GameRepositoryService,
    private shared: SharedDataService,
  ) { }
  
  useTemplate(template: string, html: string): Observable<string> {
    return this.repository
    .observeResource(this.shared.getGameResourceUrl(template))
    .pipe(map(t => this.mergeHtmlInTemplate(t, html)));
  }

  mergeHtmlInTemplate(t: string, h: string): string {
    const templateDoc = new DOMParser().parseFromString(t, 'text/html');
    const replacementDoc = new DOMParser().parseFromString(h, 'text/html');
    const replacements = replacementDoc.querySelectorAll('.template-replace');
    replacements.forEach((element) => {
      const selector = element.getAttribute('data-selector');
      if (selector) {
        console.log('selector', selector);
        const elementsToReplace = templateDoc.querySelectorAll(selector)
        .forEach(toreplace => toreplace.parentNode?.replaceChild(element.cloneNode(true), toreplace));
      } else {
        console.log('data-selector expected for element', element);
      }
    });
    return templateDoc.documentElement.outerHTML;
  }



}
