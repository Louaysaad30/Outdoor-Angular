import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatConvComponent } from './chat-conv.component';

describe('ChatConvComponent', () => {
  let component: ChatConvComponent;
  let fixture: ComponentFixture<ChatConvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatConvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChatConvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
