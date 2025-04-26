import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmEventareaListComponent } from './em-eventarea-list.component';

describe('EmEventareaListComponent', () => {
  let component: EmEventareaListComponent;
  let fixture: ComponentFixture<EmEventareaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmEventareaListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmEventareaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
