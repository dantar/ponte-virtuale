import { TestBed } from '@angular/core/testing';

import { LeafletSettingsService } from './leaflet-settings.service';

describe('LeafletSettingsService', () => {
  let service: LeafletSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeafletSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
