import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationInvoiceComponent } from './reservation-invoice.component';

describe('ReservationInvoiceComponent', () => {
  let component: ReservationInvoiceComponent;
  let fixture: ComponentFixture<ReservationInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationInvoiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReservationInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
