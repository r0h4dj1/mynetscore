import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { BottomSheetService } from './bottom-sheet.service';

@Component({ standalone: true, template: '<p>Test</p>' })
class DummyComponent {}

describe('BottomSheetService', () => {
  let service: BottomSheetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BottomSheetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with a closed state', () => {
    const state = service.state();
    expect(state.isOpen).toBe(false);
    expect(state.component).toBeNull();
    expect(state.inputs).toBeNull();
  });

  it('open() should set state to open with component', async () => {
    const promise = service.open(DummyComponent);
    const state = service.state();

    expect(state.isOpen).toBe(true);
    expect(state.component).toBe(DummyComponent);
    expect(state.inputs).toBeNull();

    service.dismiss();
    await promise;
  });

  it('open() should pass inputs into state', async () => {
    const inputs = { foo: 'bar' };
    const promise = service.open(DummyComponent, inputs);
    const state = service.state();

    expect(state.inputs).toEqual({ foo: 'bar' });

    service.dismiss();
    await promise;
  });

  it('open() should push a history state', async () => {
    const pushSpy = vi.spyOn(globalThis.history, 'pushState');
    const promise = service.open(DummyComponent);

    expect(pushSpy).toHaveBeenCalledWith({ isBottomSheet: true }, '');
    pushSpy.mockRestore();

    service.dismiss();
    await promise;
  });

  it('dismiss() should reset state to closed', async () => {
    const promise = service.open(DummyComponent);
    service.dismiss();

    const state = service.state();
    expect(state.isOpen).toBe(false);
    expect(state.component).toBeNull();
    expect(state.inputs).toBeNull();

    await promise;
  });

  it('dismiss() should resolve the open() promise', async () => {
    const promise = service.open(DummyComponent);
    service.dismiss();
    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('dismiss(result) should resolve the open() promise with the result', async () => {
    const promise = service.open(DummyComponent);
    const payload = { action: 'save', data: 42 };
    service.dismiss(payload);
    const result = await promise;
    expect(result).toEqual({ action: 'save', data: 42 });
  });

  it('dismiss() when already closed should be a no-op', () => {
    // Should not throw
    service.dismiss();
    const state = service.state();
    expect(state.isOpen).toBe(false);
  });

  it('popstate event should trigger dismiss', async () => {
    const promise = service.open(DummyComponent);
    expect(service.state().isOpen).toBe(true);

    globalThis.dispatchEvent(new PopStateEvent('popstate', { state: { isBottomSheet: true } }));

    const state = service.state();
    expect(state.isOpen).toBe(false);

    await promise;
  });
});
