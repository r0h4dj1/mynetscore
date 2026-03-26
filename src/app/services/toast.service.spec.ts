import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set toast signal with message and default duration', () => {
    service.presentErrorToast('Error message');
    expect(service.toast()).toEqual({ message: 'Error message', duration: 3000 });
  });

  it('should honor custom duration', () => {
    service.presentErrorToast('Error message', 5000);
    expect(service.toast()).toEqual({ message: 'Error message', duration: 5000 });
  });

  it('should auto-dismiss after duration', () => {
    service.presentErrorToast('Error message', 3000);
    expect(service.toast()).not.toBeNull();

    vi.advanceTimersByTime(3000);
    expect(service.toast()).toBeNull();
  });

  it('should dismiss immediately when dismiss() is called', () => {
    service.presentErrorToast('Error message', 5000);
    expect(service.toast()).not.toBeNull();

    service.dismiss();
    expect(service.toast()).toBeNull();
  });

  it('should clear previous timer when presenting a new toast', () => {
    service.presentErrorToast('First', 3000);
    service.presentErrorToast('Second', 5000);

    vi.advanceTimersByTime(3000);
    expect(service.toast()).toEqual({ message: 'Second', duration: 5000 });

    vi.advanceTimersByTime(2000);
    expect(service.toast()).toBeNull();
  });
});
