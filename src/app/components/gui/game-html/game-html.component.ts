import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { HtmlTemplatesService } from 'src/app/services/html-templates.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-game-html',
  templateUrl: './game-html.component.html',
  styleUrls: ['./game-html.component.scss']
})
export class GameHtmlComponent implements OnInit, OnChanges {

  @Input() url: string;
  @Input() template?: string;
  @Input() data?: {[key:string]: number|string};
  @Output() clickable = new EventEmitter();

  loading: boolean;
  html: string;

  constructor(
    private repository: GameRepositoryService, 
    private shared: SharedDataService,
    private templates: HtmlTemplatesService,
  ) {

  }

  ngOnChanges(changes: SimpleChanges): void {
    this.refreshHtml();
  }

  ngOnInit() {
    this.refreshHtml();
  }

  private refreshHtml() {
    this.loading = true;
    this.repository.observeResource(this.shared.getGameResourceUrl(this.url))
    .subscribe(
      {
        next: htmlsource => {
          if (this.template) {
            this.templates
            .useTemplate(this.template, htmlsource)
            .subscribe(r => this.setHtml(r));
          } else {
            this.setHtml(htmlsource);
          }

        },
        error: error => {
          console.log(`problem with file ${this.url}`);
          this.loading = false;
        }
      }
    );
  }

  setHtml(html: string) {
    this.html = this.shared.getReplaceResourceUrls(html);
    if (this.data) {
      Object.keys(this.data).forEach(key => this.html = this.html
        .replaceAll(`{{${key}}}`, this.data ? ''+this.data[key]: '')
        .replaceAll(`__${key}__`, this.data ? ''+this.data[key]: '')
        );
    }
    this.loading = false;
  }

}

