import { TestBed } from '@angular/core/testing';

import { IfTypeOfService } from './if-type-of.service';

describe('IfTypeOfService', () => {
  let service: IfTypeOfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IfTypeOfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
