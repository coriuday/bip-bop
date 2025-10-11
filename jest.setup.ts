import '@testing-library/jest-dom';
import { act } from 'react';
import type { act as actType } from 'react';

declare global {
  // Extend globalThis to include 'act' for test setup
  // eslint-disable-next-line no-var
  var act: typeof actType;
}

globalThis.act = act;
