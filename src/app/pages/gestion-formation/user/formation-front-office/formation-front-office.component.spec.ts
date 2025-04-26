import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormationFrontOfficeComponent } from './formation-front-office.component';

describe('FormationFrontOfficeComponent', () => {
  let component: FormationFrontOfficeComponent;
  let fixture: ComponentFixture<FormationFrontOfficeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormationFrontOfficeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormationFrontOfficeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
