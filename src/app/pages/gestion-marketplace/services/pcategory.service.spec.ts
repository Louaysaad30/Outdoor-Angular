import { TestBed } from '@angular/core/testing';

import { PCategoryService } from './pcategory.service';

describe('PCategoryService', () => {
  let service: PCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PCategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
