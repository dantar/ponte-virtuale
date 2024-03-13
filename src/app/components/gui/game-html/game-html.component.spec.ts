import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameHtmlComponent } from './game-html.component';

describe('GameHtmlComponent', () => {
  let component: GameHtmlComponent;
  let fixture: ComponentFixture<GameHtmlComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GameHtmlComponent]
    });
    fixture = TestBed.createComponent(GameHtmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
