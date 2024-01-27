import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenderHtmlComponent } from './render-html.component';

describe('RenderHtmlComponent', () => {
  let component: RenderHtmlComponent;
  let fixture: ComponentFixture<RenderHtmlComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RenderHtmlComponent]
    });
    fixture = TestBed.createComponent(RenderHtmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
