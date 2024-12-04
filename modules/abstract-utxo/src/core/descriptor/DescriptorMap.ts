import { Descriptor } from '@bitgo/wasm-miniscript';

/** Map from descriptor name to descriptor */
export type DescriptorMap = Map<string, Descriptor>;

/** Convert an array of descriptor name-value pairs to a descriptor map */
export function toDescriptorMap(descriptors: { name: string; value: string }[]): DescriptorMap {
  return new Map(descriptors.map((d) => [d.name, Descriptor.fromString(d.value, 'derivable')]));
}
