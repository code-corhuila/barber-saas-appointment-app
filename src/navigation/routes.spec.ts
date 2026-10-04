import { describe, expect, it } from 'vitest';
import { parseRoute, routePath } from './routes';

describe('routes', () => {
  it('opens the booking barbershop-app links to, with its barbershop and service', () => {
    expect(parseRoute('/new', '?barbershopId=b1&serviceId=s1'))
      .toEqual({ name: 'book', barbershopId: 'b1', serviceId: 's1' });
    expect(parseRoute('/new/')).toEqual({ name: 'book', barbershopId: undefined, serviceId: undefined });
  });

  it('starts on the home of the role for anything else', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' });
    expect(parseRoute('/nope')).toEqual({ name: 'home' });
    expect(parseRoute('/history')).toEqual({ name: 'history' });
  });

  it('writes back the same paths it reads', () => {
    expect(routePath({ name: 'book', barbershopId: 'b1', serviceId: 's1' })).toBe('/new?barbershopId=b1&serviceId=s1');
    expect(routePath({ name: 'book' })).toBe('/new');
    expect(routePath({ name: 'history' })).toBe('/history');
    expect(routePath({ name: 'home' })).toBe('/');
  });
});
