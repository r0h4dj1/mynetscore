import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { BottomSheetService } from './bottom-sheet.service';

@Component({ standalone: true, template: '<p>Test</p>' })
class DummyComponent {}

interface ExpectedResult {
  action: string;
  data: number;
}

describe('BottomSheetService', () => {
  let service: BottomSheetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BottomSheetService);
  });

  it('should open a component and resolve with a result when dismissed', async () => {
    const inputs: Record<string, unknown> = { foo: 'bar' };
    const expectedResult: ExpectedResult = { action: 'save', data: 42 };

    const promise = service.open<DummyComponent>(DummyComponent, inputs);

    expect(service.state()).toEqual({
      isOpen: true,
      component: DummyComponent,
      inputs,
    });

    service.dismiss(expectedResult);
    const result = await promise;

    expect(service.state().isOpen).toBe(false);
    expect(result).toEqual(expectedResult);
  });

  it('should dismiss an already open bottom sheet when opening a new one', async () => {
    const firstPromise = service.open<DummyComponent>(DummyComponent);

    const secondPromise = service.open<DummyComponent>(DummyComponent);

    const firstResult = await firstPromise;
    expect(firstResult).toBeUndefined();
    expect(service.state().isOpen).toBe(true);

    service.dismiss();
    await secondPromise;
  });

  it('should dismiss the bottom sheet and resolve when the browser back button is pressed', async () => {
    const promise = service.open<DummyComponent>(DummyComponent);

    globalThis.dispatchEvent(new PopStateEvent('popstate', { state: { isBottomSheet: true } }));

    const result = await promise;

    expect(service.state().isOpen).toBe(false);
    expect(result).toBeUndefined();
  });
});
