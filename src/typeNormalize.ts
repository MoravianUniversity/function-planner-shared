/**
 * Helpers for PEP 604 unions and optional (`T|None`) type strings used by the
 * planner UI and Python importer.
 */

/** Split a type string on top-level `|` (not inside `[]` / `()`). */
export function splitTopLevelUnion(type: string): string[] {
  const src = (type || '').toString();
  const results: string[] = [];
  let current = '';
  let depthBracket = 0;
  let depthParen = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '[') {
      depthBracket++;
      current += ch;
    } else if (ch === ']') {
      depthBracket--;
      current += ch;
    } else if (ch === '(') {
      depthParen++;
      current += ch;
    } else if (ch === ')') {
      depthParen--;
      current += ch;
    } else if (ch === '|' && depthBracket === 0 && depthParen === 0) {
      const part = current.trim();
      if (part) {
        results.push(part);
      }
      current = '';
    } else {
      current += ch;
    }
  }
  const last = current.trim();
  if (last) {
    results.push(last);
  }
  return results;
}

function compactType(type: string): string {
  return (type || '').toString().replace(/\s+/g, '');
}

function isNoneMember(type: string): boolean {
  return compactType(type).toLowerCase() === 'none';
}

/** True when the top-level union includes `None` (and at least one other member, or is only None). */
export function isOptionalType(type: string): boolean {
  const parts = splitTopLevelUnion(compactType(type));
  if (parts.length === 0) {
    return false;
  }
  return parts.some(isNoneMember);
}

/** Remove top-level `None` members from a union. */
export function stripOptional(type: string): string {
  const parts = splitTopLevelUnion(compactType(type)).filter((p) => !isNoneMember(p));
  return parts.join('|');
}

/** Ensure the type is optional by appending `|None` (no-op if already optional). */
export function withOptional(type: string): string {
  const stripped = stripOptional(type);
  if (!stripped) {
    // Persist optional-with-no-base as bare None so the UI can restore the checkbox;
    // validation treats this as a missing concrete type.
    return 'None';
  }
  return `${stripped}|None`;
}

/**
 * True when the type has a concrete base (after stripping optional `None`).
 * Bare `None` / empty count as missing — used for required-type checks.
 */
export function hasConcreteType(type: string): boolean {
  return stripOptional(type).length > 0;
}

/**
 * Normalize common typing forms in a raw annotation string:
 * - `Optional[T]` / `typing.Optional[T]` → `T|None`
 * - `Union[A, B]` / `typing.Union[A, B]` → `A|B`
 * Applied repeatedly until stable. Leaves other generics alone.
 */
export function normalizeTypeAnnotationString(typeStr: string): string {
  let s = compactType(typeStr);
  if (!s) {
    return '';
  }

  let changed = true;
  while (changed) {
    changed = false;
    const optional = matchOuterGeneric(s, ['Optional', 'typing.Optional']);
    if (optional) {
      s = withOptional(normalizeTypeAnnotationString(optional.inner));
      changed = true;
      continue;
    }
    const union = matchOuterGeneric(s, ['Union', 'typing.Union']);
    if (union) {
      const members = splitTopLevelCommas(union.inner).map(normalizeTypeAnnotationString);
      s = members.filter(Boolean).join('|');
      changed = true;
    }
  }
  return s;
}

function matchOuterGeneric(
  text: string,
  names: string[]
): { name: string; inner: string } | null {
  for (const name of names) {
    const prefix = name + '[';
    if (!text.startsWith(prefix) || !text.endsWith(']')) {
      continue;
    }
    // Ensure brackets match for this outer generic only.
    let depth = 0;
    for (let i = name.length; i < text.length; i++) {
      if (text[i] === '[') {
        depth++;
      } else if (text[i] === ']') {
        depth--;
        if (depth === 0 && i !== text.length - 1) {
          return null;
        }
      }
    }
    if (depth !== 0) {
      return null;
    }
    return { name, inner: text.slice(prefix.length, -1) };
  }
  return null;
}

function splitTopLevelCommas(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depthBracket = 0;
  let depthParen = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '[') {
      depthBracket++;
      current += ch;
    } else if (ch === ']') {
      depthBracket--;
      current += ch;
    } else if (ch === '(') {
      depthParen++;
      current += ch;
    } else if (ch === ')') {
      depthParen--;
      current += ch;
    } else if (ch === ',' && depthBracket === 0 && depthParen === 0) {
      const part = current.trim();
      if (part) {
        parts.push(part);
      }
      current = '';
    } else {
      current += ch;
    }
  }
  const last = current.trim();
  if (last) {
    parts.push(last);
  }
  return parts;
}
