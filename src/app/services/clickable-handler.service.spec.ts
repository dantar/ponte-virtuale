import { TestBed } from '@angular/core/testing';

import { ClickableHandlerService } from './clickable-handler.service';

describe('ClickableHandlerService', () => {
  let service: ClickableHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClickableHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
