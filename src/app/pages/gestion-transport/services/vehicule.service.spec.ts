import { VehiculeService } from './vehicule.service';
import { TestBed } from '@angular/core/testing';


describe('VehiculeService', () => {
  let service: VehiculeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VehiculeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
