import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MockInstance } from 'vitest';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../services/toast.service';

describe('ToastContainerComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ToastContainerComponent>>;
  let toastServiceMock: {
    toast: ReturnType<typeof signal<{ message: string; duration: number } | null>>;
    dismiss: MockInstance;
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    toastServiceMock = {
      toast: signal<{ message: string; duration: number } | null>(null),
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [{ provide: ToastService, useValue: toastServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
  });

  afterEach(() => {
    // Flush pending timeouts to avoid side effects between tests
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('renders and hides the toast message reflecting the service state', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.toast')).toBeNull();

    toastServiceMock.toast.set({ message: 'Something went wrong', duration: 3000 });
    fixture.detectChanges();

    const toast = el.querySelector('.toast');
    expect(toast).toBeTruthy();
    expect(toast?.textContent?.trim()).toBe('Something went wrong');

    toastServiceMock.toast.set(null);
    fixture.detectChanges();

    // Fast-forward through any dismiss animation timeouts (avoids hardcoded ms values)
    vi.runAllTimers();
    fixture.detectChanges();

    expect(el.querySelector('.toast')).toBeNull();
  });
});
