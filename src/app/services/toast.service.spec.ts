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

  it('should present an error toast and auto-dismiss after the duration', () => {
    service.presentErrorToast('Network error', 3000);
    expect(service.toast()).toEqual({ message: 'Network error', duration: 3000 });

    vi.advanceTimersByTime(3000);
    expect(service.toast()).toBeNull();
  });

  it('should allow manual dismissal of an active toast', () => {
    service.presentErrorToast('Dismiss me');
    expect(service.toast()).not.toBeNull();

    service.dismiss();
    expect(service.toast()).toBeNull();
  });

  it('should only show the most recent toast when called in rapid succession', () => {
    service.presentErrorToast('First error', 3000);
    service.presentErrorToast('Second error', 5000);

    // After 3000ms, the first toast's timer would have expired,
    // but the second toast should still be active because its timer reset the duration.
    vi.advanceTimersByTime(3000);
    expect(service.toast()).toEqual({ message: 'Second error', duration: 5000 });

    // After another 2000ms (total 5000ms), the second toast should auto-dismiss.
    vi.advanceTimersByTime(2000);
    expect(service.toast()).toBeNull();
  });
});
