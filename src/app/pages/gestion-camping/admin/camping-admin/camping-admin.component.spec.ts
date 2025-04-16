import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampingAdminComponent } from './camping-admin.component';

describe('CampingAdminComponent', () => {
  let component: CampingAdminComponent;
  let fixture: ComponentFixture<CampingAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampingAdminComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CampingAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
