import { TestBed } from '@angular/core/testing';

import { LigneReservationService } from './ligne-reservation.service';

describe('LigneReservationService', () => {
  let service: LigneReservationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LigneReservationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
