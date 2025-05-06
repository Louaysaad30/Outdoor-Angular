import { ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<<< HEAD:src/app/pages/gestion-transport/agence/add-vehicule/add-vehicule.component.spec.ts
import { AddVehiculeComponent } from './add-vehicule.component';

describe('AddVehiculeComponent', () => {
  let component: AddVehiculeComponent;
  let fixture: ComponentFixture<AddVehiculeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddVehiculeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddVehiculeComponent);
========
import { ListUsersComponent } from './list-users.component';

describe('ListUsersComponent', () => {
  let component: ListUsersComponent;
  let fixture: ComponentFixture<ListUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListUsersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListUsersComponent);
>>>>>>>> 1cb08425a7663cc1a65c9e14491dbffab52aac7e:src/app/pages/gestion-user/admin/list-users/list-users.component.spec.ts
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
