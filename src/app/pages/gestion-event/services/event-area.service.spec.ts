import { TestBed } from '@angular/core/testing';

import { EventAreaService } from './event-area.service';

describe('EventAreaService', () => {
  let service: EventAreaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventAreaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
