import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { BackNavigationService } from './back-navigation.service';

describe('BackNavigationService', () => {
  let events$: Subject<unknown>;
  let routerMock: { events: Subject<unknown>; url: string; navigateByUrl: ReturnType<typeof vi.fn> };
  let locationMock: { back: ReturnType<typeof vi.fn> };
  let service: BackNavigationService;

  function emitNavigation(url: string): void {
    routerMock.url = url;
    events$.next(new NavigationEnd(1, url, url));
  }

  beforeEach(() => {
    events$ = new Subject<unknown>();
    routerMock = {
      events: events$,
      url: '/',
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };
    locationMock = { back: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: locationMock },
      ],
    });

    service = TestBed.inject(BackNavigationService);
  });

  it('falls back to the parent route when no in-app navigation has occurred', () => {
    emitNavigation('/rounds/abc/edit');

    service.back();

    expect(locationMock.back).not.toHaveBeenCalled();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/rounds');
  });

  it('falls back to root when the current url has no parent segment', () => {
    emitNavigation('/home');

    service.back();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('strips query strings and fragments when deriving the fallback', () => {
    emitNavigation('/courses/c1?from=search#hole-1');

    service.back();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/courses');
  });

  it('uses location.back() once the user has navigated within the app', () => {
    emitNavigation('/rounds');
    emitNavigation('/rounds/abc/edit');

    service.back();

    expect(locationMock.back).toHaveBeenCalledTimes(1);
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });
});
