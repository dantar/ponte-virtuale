import { TestBed } from '@angular/core/testing';

import { ButtonsMenuService } from './buttons-menu.service';

describe('ButtonsMenuService', () => {
  let service: ButtonsMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ButtonsMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
