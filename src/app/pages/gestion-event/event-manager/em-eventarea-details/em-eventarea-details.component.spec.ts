import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmEventareaDetailsComponent } from './em-eventarea-details.component';

describe('EmEventareaDetailsComponent', () => {
  let component: EmEventareaDetailsComponent;
  let fixture: ComponentFixture<EmEventareaDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmEventareaDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmEventareaDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
