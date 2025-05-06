import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormateurDashboardComponent } from './formateur-dashboard.component';

describe('FormateurDashboardComponent', () => {
  let component: FormateurDashboardComponent;
  let fixture: ComponentFixture<FormateurDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormateurDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormateurDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
