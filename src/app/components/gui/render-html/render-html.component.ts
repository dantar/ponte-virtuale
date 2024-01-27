import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-render-html',
  templateUrl: './render-html.component.html',
  styleUrls: ['./render-html.component.scss']
})
export class RenderHtmlComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() html: string | SafeHtml;
  @ViewChild("placeholder", {static: true}) placeholder: ElementRef;

  listeners: (()=>void)[] = [];

  constructor(
    public shared: SharedDataService,
    private renderer: Renderer2
    ) {

  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.initClickables();
  }

  ngOnDestroy(): void {
    // destroy all listeners
    this.listeners.forEach(l => l());
  }

  private initClickables() {
    const clickables = this.placeholder.nativeElement.getElementsByClassName('clickable');
    for (let index = 0; index < clickables.length; index++) {
      const clickable = clickables[index];
      // register listener
      this.listeners.push(
        this.renderer.listen(clickable, 'click', (event) => {
          const target = clickable.closest(".clickable").getAttribute('data-target');
          if (target) {
            this.shared.triggerAction(target);
          }
        })
      );
    }
  }

}
