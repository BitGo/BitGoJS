import {AddressFormat} from "./enum";
import {KeyPairOptions} from "./iface";

/**
 * Base keys and address management.
 */
export abstract class BaseKeyPair {

    protected constructor(protected source?: KeyPairOptions) {}

    protected abstract recordKeysFromPrivateKey(prv: string): void;
    protected abstract recordKeysFromPublicKey(pub: string): void;

        /**
     * Returns the keys in the protocol default key format
     */
    abstract getKeys(): any;

    /**
     * Returns the address in the protocol default format
     */
    abstract getAddress(format?: AddressFormat): string;
}
