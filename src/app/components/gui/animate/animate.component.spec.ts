import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimateComponent } from './animate.component';

describe('AnimateComponent', () => {
  let component: AnimateComponent;
  let fixture: ComponentFixture<AnimateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AnimateComponent]
    });
    fixture = TestBed.createComponent(AnimateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
