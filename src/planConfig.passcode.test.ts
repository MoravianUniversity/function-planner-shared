import { describe, expect, it } from 'vitest';
import {
  parsePlanConfig,
  passcodeFromSettings,
  passcodeWasAdded,
  redactPasscodeFromSettings
} from './planConfig.js';

describe('passcodeFromSettings', () => {
  it('treats missing, blank, and non-string values as unset', () => {
    expect(passcodeFromSettings(null)).toBe('');
    expect(passcodeFromSettings({})).toBe('');
    expect(passcodeFromSettings({ passcode: '   ' })).toBe('');
    expect(passcodeFromSettings({ passcode: 12 })).toBe('');
  });

  it('trims and keeps case', () => {
    expect(passcodeFromSettings({ passcode: '  Lab-1 ' })).toBe('Lab-1');
  });
});

describe('passcodeWasAdded', () => {
  it('is true only when a code goes from unset to set', () => {
    expect(passcodeWasAdded({}, { passcode: 'lab' })).toBe(true);
    expect(passcodeWasAdded({ passcode: '  ' }, { passcode: 'lab' })).toBe(true);
    expect(passcodeWasAdded({ passcode: 'lab' }, { passcode: 'other' })).toBe(false);
    expect(passcodeWasAdded({ passcode: 'lab' }, {})).toBe(false);
    expect(passcodeWasAdded({ passcode: 'lab' }, { passcode: 'lab' })).toBe(false);
  });
});

describe('redactPasscodeFromSettings', () => {
  it('removes the passcode and drops settings that only held it', () => {
    expect(redactPasscodeFromSettings({ passcode: 'lab', minFunctions: 2 })).toEqual({
      minFunctions: 2
    });
    expect(redactPasscodeFromSettings({ passcode: 'lab' })).toBeNull();
  });

  it('leaves settings without a passcode unchanged', () => {
    const settings = { minFunctions: 2 };
    expect(redactPasscodeFromSettings(settings)).toBe(settings);
    expect(redactPasscodeFromSettings(null)).toBeNull();
  });
});

describe('parsePlanConfig passcode', () => {
  it('defaults to empty and trims a configured code', () => {
    expect(parsePlanConfig(null).passcode).toBe('');
    expect(parsePlanConfig({ passcode: '  Lab-1 ' }).passcode).toBe('Lab-1');
  });
});
