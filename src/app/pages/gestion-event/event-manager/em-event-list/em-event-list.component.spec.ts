import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmEventListComponent } from './em-event-list.component';

describe('EmEventListComponent', () => {
  let component: EmEventListComponent;
  let fixture: ComponentFixture<EmEventListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmEventListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmEventListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
