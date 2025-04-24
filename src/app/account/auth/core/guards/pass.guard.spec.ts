import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { passGuard } from './pass.guard';

describe('passGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => passGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
