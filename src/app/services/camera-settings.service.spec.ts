import { TestBed } from '@angular/core/testing';

import { CameraSettingsService } from './camera-settings.service';

describe('CameraSettingsService', () => {
  let service: CameraSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CameraSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
