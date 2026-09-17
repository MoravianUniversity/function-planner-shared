export const isCourseReadonly = (endsAt: Date | string, now = new Date()): boolean => {
  const date = endsAt instanceof Date ? endsAt : new Date(endsAt);
  return date.getTime() < now.getTime();
};

const toTime = (value: Date | string): number =>
  value instanceof Date ? value.getTime() : new Date(value).getTime();

/** Course is active when now is in [startsAt, endsAt] (end exclusive of readonly: endsAt >= now). */
export const isCourseActive = (
  startsAt: Date | string,
  endsAt: Date | string,
  now = new Date()
): boolean => {
  const t = now.getTime();
  return toTime(startsAt) <= t && !isCourseReadonly(endsAt, now);
};

export type CourseSchedule = {
  id: string;
  startsAt: string;
  endsAt: string;
};

/**
 * Pick the course a fresh browsing context should use:
 * 1) among active courses, latest startsAt
 * 2) else soonest upcoming by startsAt
 * 3) else most recently ended by endsAt
 */
export const pickDefaultCourseId = <T extends CourseSchedule>(
  courses: T[],
  now = new Date()
): string | null => {
  if (courses.length === 0) {
    return null;
  }
  return sortCoursesForDisplay(courses, now)[0]?.id ?? null;
};

/** Display order matches default-pick priority: active, then upcoming, then past. */
export const sortCoursesForDisplay = <T extends CourseSchedule>(
  courses: T[],
  now = new Date()
): T[] => {
  const active: T[] = [];
  const upcoming: T[] = [];
  const past: T[] = [];

  for (const course of courses) {
    if (isCourseActive(course.startsAt, course.endsAt, now)) {
      active.push(course);
    } else if (toTime(course.startsAt) > now.getTime()) {
      upcoming.push(course);
    } else {
      past.push(course);
    }
  }

  active.sort((a, b) => (a.startsAt < b.startsAt ? 1 : a.startsAt > b.startsAt ? -1 : 0));
  upcoming.sort((a, b) => (a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : 0));
  past.sort((a, b) => (a.endsAt < b.endsAt ? 1 : a.endsAt > b.endsAt ? -1 : 0));

  return [...active, ...upcoming, ...past];
};
