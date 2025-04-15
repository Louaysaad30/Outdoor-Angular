import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgenceReservationsComponent } from './agence-reservations.component';

describe('AgenceReservationsComponent', () => {
  let component: AgenceReservationsComponent;
  let fixture: ComponentFixture<AgenceReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgenceReservationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgenceReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
