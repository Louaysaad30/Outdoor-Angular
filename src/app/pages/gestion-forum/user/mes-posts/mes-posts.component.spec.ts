import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesPostsComponent } from './mes-posts.component';

describe('MesPostsComponent', () => {
  let component: MesPostsComponent;
  let fixture: ComponentFixture<MesPostsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesPostsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MesPostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
