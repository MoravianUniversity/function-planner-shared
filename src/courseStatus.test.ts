import { describe, expect, it } from 'vitest';
import { isCourseActive, pickDefaultCourseId, sortCoursesForDisplay } from './courseStatus.js';

const course = (id: string, startsAt: string, endsAt: string) => ({ id, startsAt, endsAt });

describe('isCourseActive', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('is active when now is within [startsAt, endsAt]', () => {
    expect(
      isCourseActive('2026-06-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z', now)
    ).toBe(true);
  });

  it('is inactive before startsAt', () => {
    expect(
      isCourseActive('2026-07-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z', now)
    ).toBe(false);
  });

  it('is inactive after endsAt', () => {
    expect(
      isCourseActive('2026-05-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z', now)
    ).toBe(false);
  });
});

describe('pickDefaultCourseId', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('prefers active course with latest startsAt', () => {
    const courses = [
      course('old-active', '2026-01-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z'),
      course('new-active', '2026-06-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z'),
      course('upcoming', '2026-07-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z')
    ];
    expect(pickDefaultCourseId(courses, now)).toBe('new-active');
  });

  it('picks soonest upcoming when none are active', () => {
    const courses = [
      course('later', '2026-09-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z'),
      course('sooner', '2026-07-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z'),
      course('past', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z')
    ];
    expect(pickDefaultCourseId(courses, now)).toBe('sooner');
  });

  it('picks most recently ended when all are past', () => {
    const courses = [
      course('older', '2025-01-01T00:00:00.000Z', '2025-05-01T00:00:00.000Z'),
      course('newer', '2025-06-01T00:00:00.000Z', '2025-12-01T00:00:00.000Z')
    ];
    expect(pickDefaultCourseId(courses, now)).toBe('newer');
  });

  it('returns null for empty list', () => {
    expect(pickDefaultCourseId([], now)).toBeNull();
  });
});

describe('sortCoursesForDisplay', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('orders active, then upcoming, then past', () => {
    const courses = [
      course('past', '2025-01-01T00:00:00.000Z', '2025-06-01T00:00:00.000Z'),
      course('upcoming', '2026-08-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z'),
      course('active', '2026-05-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z')
    ];
    expect(sortCoursesForDisplay(courses, now).map((c) => c.id)).toEqual([
      'active',
      'upcoming',
      'past'
    ]);
  });
});
