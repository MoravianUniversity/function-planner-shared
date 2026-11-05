import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAN_CONFIG, parsePlanConfig } from './planConfig.js';

describe('advanced type plan config flags', () => {
  it('defaults the three flags to false', () => {
    expect(DEFAULT_PLAN_CONFIG.allowOptionalTypes).toBe(false);
    expect(DEFAULT_PLAN_CONFIG.allowUnionTypes).toBe(false);
    expect(DEFAULT_PLAN_CONFIG.allowParamDefaults).toBe(false);
    const parsed = parsePlanConfig({});
    expect(parsed.allowOptionalTypes).toBe(false);
    expect(parsed.allowUnionTypes).toBe(false);
    expect(parsed.allowParamDefaults).toBe(false);
  });

  it('parses enabled flags from settings', () => {
    const parsed = parsePlanConfig({
      allowOptionalTypes: true,
      allowUnionTypes: true,
      allowParamDefaults: true
    });
    expect(parsed.allowOptionalTypes).toBe(true);
    expect(parsed.allowUnionTypes).toBe(true);
    expect(parsed.allowParamDefaults).toBe(true);
  });
});
