import { TestBed } from '@angular/core/testing';

import { CentreCampingService } from './centrecamping.service';

describe('CentrecampingService', () => {
  let service: CentreCampingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CentreCampingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
