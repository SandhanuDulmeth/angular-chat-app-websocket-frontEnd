import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminChatComponent } from './admin-chat.component';

describe('AdminChatComponentComponent', () => {
  let component: AdminChatComponent;
  let fixture: ComponentFixture<AdminChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
