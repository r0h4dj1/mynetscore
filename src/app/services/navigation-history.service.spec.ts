import { TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { NavigationHistoryService } from './navigation-history.service';
import { Subject } from 'rxjs';
import { Mock } from 'vitest';

type RouterEvents = NavigationEnd | NavigationCancel | NavigationError;

interface MockRouter {
  events: Subject<RouterEvents>;
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

  it('should prevent navigation loop in pop() using isPopping flag', async () => {
    router.url = '/rounds/add';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    routerEventsSubject.next(new NavigationEnd(2, '/rounds/add', '/rounds/add'));

    await service.pop();

    routerEventsSubject.next(new NavigationEnd(3, '/rounds', '/rounds'));

    expect(service.getHistory('rounds')).toEqual(['/rounds']);
  });

  it('should reset isPopping if navigation is canceled', async () => {
    router.url = '/rounds';
    routerEventsSubject.next(new NavigationEnd(1, '/rounds', '/rounds'));
    router.url = '/rounds/add';
    routerEventsSubject.next(new NavigationEnd(2, '/rounds/add', '/rounds/add'));

    await service.pop(); // Sets isPopping = true

    // Simulate cancellation
    routerEventsSubject.next(new NavigationCancel(3, '/rounds', 'Canceled by guard'));

    // Perform a new navigation that should be tracked
    router.url = '/courses';
    routerEventsSubject.next(new NavigationEnd(4, '/courses', '/courses'));

    expect(service.getHistory('courses')).toEqual(['/courses']);
  });
});
