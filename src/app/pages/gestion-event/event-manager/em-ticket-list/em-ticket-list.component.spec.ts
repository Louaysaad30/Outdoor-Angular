import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmTicketListComponent } from './em-ticket-list.component';

describe('EmTicketListComponent', () => {
  let component: EmTicketListComponent;
  let fixture: ComponentFixture<EmTicketListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmTicketListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmTicketListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
