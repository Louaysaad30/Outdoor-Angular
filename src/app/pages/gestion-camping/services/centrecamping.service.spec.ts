import { TestBed } from '@angular/core/testing';

import { CentrecampingService } from './centrecamping.service';

describe('CentrecampingService', () => {
  let service: CentrecampingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CentrecampingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
