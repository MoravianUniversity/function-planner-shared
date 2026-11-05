import { describe, expect, it } from 'vitest';
import {
  hasConcreteType,
  isOptionalType,
  normalizeTypeAnnotationString,
  splitTopLevelUnion,
  stripOptional,
  withOptional
} from './typeNormalize.js';

describe('typeNormalize', () => {
  it('splits top-level unions without breaking generics', () => {
    expect(splitTopLevelUnion('int|str')).toEqual(['int', 'str']);
    expect(splitTopLevelUnion('list[int|str]|None')).toEqual(['list[int|str]', 'None']);
    expect(splitTopLevelUnion('dict[str, int|float]')).toEqual(['dict[str, int|float]']);
  });

  it('detects and strips optional None members', () => {
    expect(isOptionalType('int|None')).toBe(true);
    expect(isOptionalType('None|int')).toBe(true);
    expect(isOptionalType('int|str|None')).toBe(true);
    expect(isOptionalType('int')).toBe(false);
    expect(isOptionalType('')).toBe(false);

    expect(stripOptional('int|None')).toBe('int');
    expect(stripOptional('None|int|str')).toBe('int|str');
    expect(stripOptional('None')).toBe('');
  });

  it('adds optional None without duplicating', () => {
    expect(withOptional('int')).toBe('int|None');
    expect(withOptional('int|None')).toBe('int|None');
    expect(withOptional('')).toBe('None');
    expect(withOptional('int|str')).toBe('int|str|None');
  });

  it('treats bare None / empty as missing concrete type', () => {
    expect(hasConcreteType('')).toBe(false);
    expect(hasConcreteType('None')).toBe(false);
    expect(hasConcreteType('int')).toBe(true);
    expect(hasConcreteType('int|None')).toBe(true);
  });

  it('normalizes Optional and Union annotation strings', () => {
    expect(normalizeTypeAnnotationString('Optional[int]')).toBe('int|None');
    expect(normalizeTypeAnnotationString('typing.Optional[list[int]]')).toBe('list[int]|None');
    expect(normalizeTypeAnnotationString('Union[int, str]')).toBe('int|str');
    expect(normalizeTypeAnnotationString('typing.Union[int, None]')).toBe('int|None');
    expect(normalizeTypeAnnotationString('Optional[Union[int, str]]')).toBe('int|str|None');
  });
});
