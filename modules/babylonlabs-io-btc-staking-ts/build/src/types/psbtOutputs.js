"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPsbtOutputExtendedAddress = void 0;
const isPsbtOutputExtendedAddress = (output) => {
    return output.address !== undefined;
};
exports.isPsbtOutputExtendedAddress = isPsbtOutputExtendedAddress;
