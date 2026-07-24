export type FormatTreeOrJson = 'tree' | 'json';

export const formatTreeOrJson = {
  type: 'string',
  choices: ['tree', 'json'] as const,
  default: 'tree',
  coerce(arg: string): 'tree' | 'json' {
    if (arg !== 'tree' && arg !== 'json') {
      throw new Error(`invalid format ${arg}`);
    }
    return arg;
  },
} as const;
