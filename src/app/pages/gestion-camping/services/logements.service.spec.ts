import { TestBed } from '@angular/core/testing';

import { LogementsService } from './logements.service';

describe('LogementsService', () => {
  let service: LogementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LogementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
