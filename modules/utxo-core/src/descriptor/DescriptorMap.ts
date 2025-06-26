import type { Descriptor } from '@bitgo/wasm-miniscript';

import { Descriptor as DescriptorClass } from '../miniscript';

/** Map from descriptor name to descriptor */
export type DescriptorMap = Map<string, Descriptor>;

/** Convert an array of descriptor name-value pairs to a descriptor map */
export function toDescriptorMap(descriptors: { name: string; value: Descriptor | string }[]): DescriptorMap {
  return new Map(
    descriptors.map((d) => [
      d.name,
      d.value instanceof DescriptorClass ? d.value : DescriptorClass.fromStringDetectType(d.value),
    ])
  );
}
