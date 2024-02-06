import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-render-html',
  templateUrl: './render-html.component.html',
  styleUrls: ['./render-html.component.scss']
})
export class RenderHtmlComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() html: string | SafeHtml;
  @ViewChild("placeholder", {static: true}) placeholder: ElementRef;
  @Output() clickable = new EventEmitter();

  listeners: (()=>void)[] = [];

  constructor(
    private renderer: Renderer2,
    private ng: NgZone,
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
          this.ng.run(() => {
            this.clickable.emit(event);
          });
        })
      );
    }
  }

}
