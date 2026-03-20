import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { ToastService } from './toast.service';
import { MockInstance } from 'vitest';

describe('ToastService', () => {
  let service: ToastService;
  let toastControllerMock: { create: MockInstance };
  let toastMock: { present: MockInstance };

  beforeEach(() => {
    toastMock = {
      present: vi.fn().mockResolvedValue(undefined),
    };
    toastControllerMock = {
      create: vi.fn().mockResolvedValue(toastMock),
    };

    TestBed.configureTestingModule({
      providers: [ToastService, { provide: ToastController, useValue: toastControllerMock }],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should present an error toast from the top with defaults', async () => {
    await service.presentErrorToast('Error message');
    expect(toastControllerMock.create).toHaveBeenCalledWith({
      message: 'Error message',
      duration: 3000,
      color: 'danger',
      position: 'top',
    });
    expect(toastMock.present).toHaveBeenCalled();
  });

  it('should honor custom duration for error toasts', async () => {
    await service.presentErrorToast('Error message', 5000);
    expect(toastControllerMock.create).toHaveBeenCalledWith({
      message: 'Error message',
      duration: 5000,
      color: 'danger',
      position: 'top',
    });
    expect(toastMock.present).toHaveBeenCalled();
  });
});
