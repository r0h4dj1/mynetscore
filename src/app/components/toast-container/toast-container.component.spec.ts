import { TestBed, fakeAsync, tick } from '@angular/core/testing';
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

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not render a toast when signal is null', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('div')).toBeNull();
  });

  it('renders the toast message when signal is set', fakeAsync(() => {
    toastServiceMock.toast.set({ message: 'Something went wrong', duration: 3000 });
    fixture.detectChanges();
    tick();

    const el = fixture.nativeElement as HTMLElement;
    const toast = el.querySelector('div');
    expect(toast).toBeTruthy();
    expect(toast?.textContent?.trim()).toBe('Something went wrong');
  }));

  it('removes toast element after dismiss transition completes', fakeAsync(() => {
    toastServiceMock.toast.set({ message: 'Error', duration: 3000 });
    fixture.detectChanges();
    tick();

    toastServiceMock.toast.set(null);
    fixture.detectChanges();
    tick(200);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('div')).toBeNull();
  }));
});
