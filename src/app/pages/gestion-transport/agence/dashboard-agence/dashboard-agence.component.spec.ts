import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAgenceComponent } from './dashboard-agence.component';

describe('DashboardAgenceComponent', () => {
  let component: DashboardAgenceComponent;
  let fixture: ComponentFixture<DashboardAgenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAgenceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardAgenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
