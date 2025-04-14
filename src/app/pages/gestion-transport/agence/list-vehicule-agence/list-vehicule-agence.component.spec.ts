import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListVehiculeAgenceComponent } from './list-vehicule-agence.component';

describe('ListVehiculeAgenceComponent', () => {
  let component: ListVehiculeAgenceComponent;
  let fixture: ComponentFixture<ListVehiculeAgenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListVehiculeAgenceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListVehiculeAgenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
