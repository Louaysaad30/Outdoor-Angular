import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeatilCentreComponent } from './deatil-centre.component';

describe('DeatilCentreComponent', () => {
  let component: DeatilCentreComponent;
  let fixture: ComponentFixture<DeatilCentreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeatilCentreComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeatilCentreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
