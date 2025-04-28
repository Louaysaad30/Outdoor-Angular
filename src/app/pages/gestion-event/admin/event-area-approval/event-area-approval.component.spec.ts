import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventAreaApprovalComponent } from './event-area-approval.component';

describe('EventAreaApprovalComponent', () => {
  let component: EventAreaApprovalComponent;
  let fixture: ComponentFixture<EventAreaApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventAreaApprovalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventAreaApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
