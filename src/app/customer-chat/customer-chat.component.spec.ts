import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerChatComponent } from './customer-chat.component';

describe('CustomerChatComponent', () => {
  let component: CustomerChatComponent;
  let fixture: ComponentFixture<CustomerChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
