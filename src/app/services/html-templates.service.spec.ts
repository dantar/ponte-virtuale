import { TestBed } from '@angular/core/testing';

import { HtmlTemplatesService } from './html-templates.service';

describe('HtmlTemplatesService', () => {
  let service: HtmlTemplatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HtmlTemplatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
