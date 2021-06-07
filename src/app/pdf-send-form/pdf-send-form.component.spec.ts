import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfSendFormComponent } from './pdf-send-form.component';

describe('PdfSendFormComponent', () => {
  let component: PdfSendFormComponent;
  let fixture: ComponentFixture<PdfSendFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfSendFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfSendFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
