import { describe, expect, it } from 'vitest';
import { comparePlans } from './planCompare.js';
import type { PlannerModel } from './solutionMerge.js';

const expected: PlannerModel = {
  documentation: 'Module docs',
  globalCode: 'X = 1',
  functions: [
    {
      key: 'a',
      name: 'main',
      desc: 'Entry',
      params: [],
      returns: [],
      io: 'none',
      testable: false,
      code: 'helper(1)'
    },
    {
      key: 'b',
      name: 'helper',
      desc: 'Help',
      params: [{ name: 'x', type: 'int', desc: '' }],
      returns: [{ type: 'int', desc: '' }],
      io: 'none',
      testable: true,
      code: 'return x'
    }
  ],
  calls: [{ from: 'a', to: 'b' }]
};

describe('comparePlans', () => {
  it('matches by name across different keys', () => {
    const actual: PlannerModel = {
      documentation: 'Module docs',
      globalCode: 'X = 1',
      functions: [
        {
          key: '0',
          name: 'helper',
          desc: 'Help',
          params: [{ name: 'x', type: 'int', desc: '' }],
          returns: [{ type: 'int', desc: '' }],
          io: 'none',
          testable: true,
          code: 'return x'
        },
        {
          key: '1',
          name: 'main',
          desc: 'Entry',
          params: [],
          returns: [],
          io: 'none',
          testable: false,
          code: 'helper(1)'
        }
      ],
      calls: [{ from: '1', to: '0' }]
    };
    const report = comparePlans(expected, actual, { compare: ['structural', 'types', 'docs', 'code'] });
    expect(report.differences).toEqual([]);
  });

  it('reports missing/extra functions and call edges', () => {
    const actual: PlannerModel = {
      functions: [
        { key: '0', name: 'main', params: [], returns: [], io: 'none', testable: false },
        {
          key: '1',
          name: 'extra',
          params: [{ name: 'q', type: '', desc: '' }],
          returns: [],
          io: 'input',
          testable: false
        }
      ],
      calls: []
    };
    const report = comparePlans(expected, actual, { compare: ['structural'] });
    const cats = report.differences.map((d) => d.category);
    expect(cats).toContain('functions');
    expect(cats).toContain('calls');
    expect(report.differences.some((d) => d.message.includes('helper'))).toBe(true);
    expect(report.differences.some((d) => d.message.includes('extra'))).toBe(true);
  });

  it('collapses a misspelled function name into one rename difference', () => {
    const actual: PlannerModel = {
      functions: [
        { key: '0', name: 'main', params: [], returns: [], io: 'none', testable: false },
        {
          key: '1',
          name: 'helpr',
          params: [{ name: 'x', type: 'int', desc: '' }],
          returns: [{ type: 'int', desc: '' }],
          io: 'none',
          testable: true
        }
      ],
      calls: [{ from: '0', to: '1' }]
    };
    const report = comparePlans(expected, actual, { compare: ['structural'] });
    expect(report.differences).toHaveLength(1);
    expect(report.differences[0].message).toContain('helpr');
    expect(report.differences[0].message).toContain('helper');
    expect(report.differences[0].collapsed).toBeGreaterThanOrEqual(3);
  });

  it('reports type mismatches only when types is requested', () => {
    const actual: PlannerModel = {
      functions: [
        {
          key: '0',
          name: 'main',
          params: [],
          returns: [],
          io: 'none',
          testable: false
        },
        {
          key: '1',
          name: 'helper',
          params: [{ name: 'x', type: 'str', desc: '' }],
          returns: [{ type: 'int', desc: '' }],
          io: 'none',
          testable: true
        }
      ],
      calls: [{ from: '0', to: '1' }]
    };
    expect(comparePlans(expected, actual, { compare: ['structural'] }).differences).toEqual([]);
    const withTypes = comparePlans(expected, actual, { compare: ['types'] });
    expect(withTypes.differences.some((d) => d.category === 'types')).toBe(true);
  });

  it('defaults empty compare list to structural', () => {
    const actual: PlannerModel = {
      functions: [{ key: '0', name: 'main', params: [], returns: [], io: 'none', testable: false }],
      calls: []
    };
    const report = comparePlans(expected, actual, { compare: [] });
    expect(report.compare).toEqual(['structural']);
    expect(report.differences.length).toBeGreaterThan(0);
  });
});
