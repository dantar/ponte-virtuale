import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameConfigComponent } from './game-config.component';

describe('GameConfigComponent', () => {
  let component: GameConfigComponent;
  let fixture: ComponentFixture<GameConfigComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GameConfigComponent]
    });
    fixture = TestBed.createComponent(GameConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
