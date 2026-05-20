import * as t from 'tcomb';

export const PositiveInteger = t.refinement(t.Integer, (n) => n >= 0, 'PositiveInteger');
