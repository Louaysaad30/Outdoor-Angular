import { TestBed } from '@angular/core/testing';

import { CategorieListService } from './categorie-list.service';

describe('CategorieListService', () => {
  let service: CategorieListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategorieListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
