import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayNewGameComponent } from './play-new-game.component';

describe('PlayNewGameComponent', () => {
  let component: PlayNewGameComponent;
  let fixture: ComponentFixture<PlayNewGameComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlayNewGameComponent]
    });
    fixture = TestBed.createComponent(PlayNewGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
