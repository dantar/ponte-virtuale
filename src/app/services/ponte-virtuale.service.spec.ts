import { TestBed } from '@angular/core/testing';

import { PonteVirtualeService } from './ponte-virtuale.service';

describe('PonteVirtualeService', () => {
  let service: PonteVirtualeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PonteVirtualeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
