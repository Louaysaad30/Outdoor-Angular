import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampingfrontComponent } from './campingfront.component';

describe('CampingfrontComponent', () => {
  let component: CampingfrontComponent;
  let fixture: ComponentFixture<CampingfrontComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampingfrontComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CampingfrontComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
