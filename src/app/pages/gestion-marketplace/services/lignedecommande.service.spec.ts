import { TestBed } from '@angular/core/testing';

import { LignedecommandeService } from './lignedecommande.service';

describe('LignedecommandeService', () => {
  let service: LignedecommandeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LignedecommandeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
