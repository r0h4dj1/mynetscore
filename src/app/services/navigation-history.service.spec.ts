import { TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { NavigationHistoryService } from './navigation-history.service';
import { Subject } from 'rxjs';
import { Mock } from 'vitest';

type RouterEvents = NavigationEnd | NavigationCancel | NavigationError;

interface MockRouter {
  navigateByUrl: Mock<(url: string) => Promise<boolean>>;
  url: string;
}

describe('NavigationHistoryService', () => {
  let service: NavigationHistoryService;
  let routerEventsSubject: Subject<RouterEvents>;
  let router: MockRouter;

  beforeEach(() => {
    routerEventsSubject = new Subject<RouterEvents>();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            events: routerEventsSubject.asObservable(),
            navigateByUrl: vi.fn().mockResolvedValue(true),
            url: '/home',
          },
        },
      ],
    });

    service = TestBed.inject(NavigationHistoryService);
    router = TestBed.inject(Router) as unknown as MockRouter;
  });

  it('should track navigation events separately per tab', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/home', '/home'));
    routerEventsSubject.next(new NavigationEnd(2, '/rounds', '/rounds'));
    routerEventsSubject.next(new NavigationEnd(3, '/rounds/add', '/rounds/add'));

    expect(service.getHistory('home')).toEqual(['/home']);
    expect(service.getHistory('rounds')).toEqual(['/rounds', '/rounds/add']);
  });

  it('should store urlAfterRedirects for redirected navigations', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/courses/legacy', '/courses'));

    expect(service.getHistory('courses')).toEqual(['/courses']);
  });

  it('should avoid duplicate consecutive history entries', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    routerEventsSubject.next(new NavigationEnd(2, '/rounds', '/rounds'));

    expect(service.getHistory('rounds')).toEqual(['/rounds']);
  });

  it('should recognize tab even with query parameters', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/courses?sort=name', '/courses?sort=name'));
    expect(service.getHistory('courses')).toEqual(['/courses?sort=name']);
  });

  it('should recognize tab even with fragments (hashes)', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/rounds#top', '/rounds#top'));
    expect(service.getHistory('rounds')).toEqual(['/rounds#top']);
  });

  it('should pop and navigate to previous URL within the same tab', async () => {
    router.url = '/rounds/add';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    routerEventsSubject.next(new NavigationEnd(2, '/rounds/add', '/rounds/add'));

    await service.pop();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/rounds');
    expect(service.getHistory('rounds')).toEqual(['/rounds']);
  });

  it('should navigate to tab root when deep-linked into a sub-page with empty stack', async () => {
    router.url = '/courses/123';
    routerEventsSubject.next(new NavigationEnd(1, '/courses/123', '/courses/123'));

    await service.pop();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/courses');
  });

  it('should avoid redundant navigation to home when already at the root', async () => {
    router.url = '/home';
    routerEventsSubject.next(new NavigationEnd(1, '/home', '/home'));

    router.navigateByUrl.mockClear();

    await service.pop();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it.each([
    { url: '/rounds', description: 'at a tab root' },
    { url: '/courses?sort=name', description: 'with query parameters' },
    { url: '/rounds#top', description: 'with fragment' },
  ])('should navigate to home when popping from tab root ($description)', async ({ url }) => {
    router.url = url;
    routerEventsSubject.next(new NavigationEnd(1, url, url));

    await service.pop();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should clear history for a specific tab', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/home', '/home'));
    routerEventsSubject.next(new NavigationEnd(2, '/rounds', '/rounds'));

    service.clear('home');

    expect(service.getHistory('home')).toEqual([]);
    expect(service.getHistory('rounds')).toEqual(['/rounds']);
  });

  it('should clear all history if no tab is specified', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/home', '/home'));
    routerEventsSubject.next(new NavigationEnd(2, '/rounds', '/rounds'));

    service.clear();

    expect(service.getHistory('home')).toEqual([]);
    expect(service.getHistory('rounds')).toEqual([]);
  });

  it('should not re-add the popped URL when pop navigation emits a NavigationEnd', async () => {
    router.url = '/rounds/add';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    routerEventsSubject.next(new NavigationEnd(2, '/rounds/add', '/rounds/add'));

    await service.pop();

    routerEventsSubject.next(new NavigationEnd(3, '/rounds', '/rounds'));

    expect(service.getHistory('rounds')).toEqual(['/rounds']);
  });

  it('should resume tracking after a pop navigation is canceled', async () => {
    router.url = '/rounds';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    router.url = '/rounds/add';
    routerEventsSubject.next(new NavigationEnd(2, '/rounds/add', '/rounds/add'));

    await service.pop();

    routerEventsSubject.next(new NavigationCancel(3, '/rounds', 'Canceled by guard'));

    router.url = '/courses';
    routerEventsSubject.next(new NavigationEnd(4, '/courses', '/courses'));

    expect(service.getHistory('courses')).toEqual(['/courses']);
  });

  it('should resume tracking after a pop navigation errors', async () => {
    router.url = '/rounds';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    router.url = '/rounds/add';
    routerEventsSubject.next(new NavigationEnd(2, '/rounds/add', '/rounds/add'));

    await service.pop();

    routerEventsSubject.next(new NavigationError(3, '/rounds', new Error('Router failure')));

    router.url = '/courses';
    routerEventsSubject.next(new NavigationEnd(4, '/courses', '/courses'));

    expect(service.getHistory('courses')).toEqual(['/courses']);
  });

  it('should return true if at home root', () => {
    router.url = '/home';
    routerEventsSubject.next(new NavigationEnd(1, '/home', '/home'));
    expect(service.isAtTabRoot()).toBe(true);
  });

  it('should return true if at rounds root with 1 history entry', () => {
    router.url = '/rounds';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    expect(service.isAtTabRoot()).toBe(true);
  });

  it('should return false if at a sub-page of rounds', () => {
    router.url = '/rounds/add';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    routerEventsSubject.next(new NavigationEnd(2, '/rounds/add', '/rounds/add'));
    expect(service.isAtTabRoot()).toBe(false);
  });

  it('should return false if at rounds root but has history stack longer than 1', () => {
    router.url = '/rounds';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds/add', '/rounds/add'));
    routerEventsSubject.next(new NavigationEnd(2, '/rounds', '/rounds'));
    expect(service.isAtTabRoot()).toBe(false);
  });

  it('should return true if deep-linked to rounds root', () => {
    router.url = '/rounds';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    expect(service.isAtTabRoot()).toBe(true);
  });

  it('should return false if deep-linked to rounds sub-page', () => {
    router.url = '/rounds/add';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds/add', '/rounds/add'));
    expect(service.isAtTabRoot()).toBe(false);
  });
});
