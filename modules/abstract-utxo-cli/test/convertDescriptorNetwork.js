"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const utxolib = __importStar(require("@bitgo/utxo-lib"));
const wasm_utxo_1 = require("@bitgo/wasm-utxo");
const cmdCreate_js_1 = require("../src/commands/wallet/cmdCreate.js");
describe('convertDescriptorNetwork', function () {
    it('should convert descriptor network', function () {
        const v = 'wsh(multi(2,xpub661MyMwAqRbcFVG2oSHt1P9ZgjyBmTfEmBFmjgRAkN5BUmjqfovhCdopAyaisLpUXZLP98gZu8Hxx76q4F6voPCY2CfxVPMj3wGMukHUoad/0/*,xpub661MyMwAqRbcGnBbqmKZUft1oNr9L6Gb6xSkiNafqhbWRtdZrupSCgCidbsXNyKYiPV5ZHuqtE5DRqCXigdGmUnpwSQ2c98mKjfiDHF3UMf/0/*,xpub661MyMwAqRbcGbzvzdNqgdErTSTLK3GX4x47C1HU29Y2r9KVbPa3nFPs7KY9gmfr79PrRQmoA5X2K7oZBdyCeod7JDYrPip971V3PaMtRnQ/0/*))#9hscq479';
        const vTestnet = 'wsh(multi(2,tpubD6NzVbkrYhZ4XHStFdGyDJUw1s4qkrAJJor56EUK6Gq5E4QYk2mnM5UeR1fWPqmiKTsHkiCSSE81eHbST6xAgpeq5oRGAv1xdtrmfqL4bTt/0/*,tpubD6NzVbkrYhZ4YaNTHxJegbDP8VwoKUmeeb344vdpBcMQBBJGw8fXM7sYsdxJuUGnWJ1zAsRiRKuG81h97YUWevF8139LHfnzuhG7yMEYDEW/0/*,tpubD6NzVbkrYhZ4YQBnSpMvtYaDnZYzJRmacaeQYZLcN4HvbRzCfcR8vh4hMMcwDGd5u3vm2zHfhBM51JJAaVpSYF5QMpJA5FUNgy5T9bpj3qd/0/*))#hhgk0yrv';
        assert.deepStrictEqual((0, cmdCreate_js_1.getXpubsFromDescriptor)(wasm_utxo_1.Descriptor.fromString(v, 'string')), [
            'xpub661MyMwAqRbcFVG2oSHt1P9ZgjyBmTfEmBFmjgRAkN5BUmjqfovhCdopAyaisLpUXZLP98gZu8Hxx76q4F6voPCY2CfxVPMj3wGMukHUoad',
            'xpub661MyMwAqRbcGnBbqmKZUft1oNr9L6Gb6xSkiNafqhbWRtdZrupSCgCidbsXNyKYiPV5ZHuqtE5DRqCXigdGmUnpwSQ2c98mKjfiDHF3UMf',
            'xpub661MyMwAqRbcGbzvzdNqgdErTSTLK3GX4x47C1HU29Y2r9KVbPa3nFPs7KY9gmfr79PrRQmoA5X2K7oZBdyCeod7JDYrPip971V3PaMtRnQ',
        ]);
        assert.strictEqual((0, cmdCreate_js_1.convertDescriptorXpubs)(wasm_utxo_1.Descriptor.fromString(v, 'string'), utxolib.networks.bitcoin, utxolib.networks.testnet).toString(), vTestnet);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydERlc2NyaXB0b3JOZXR3b3JrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29udmVydERlc2NyaXB0b3JOZXR3b3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBRWpDLHlEQUEyQztBQUMzQyxnREFBOEM7QUFFOUMsc0VBQXFHO0FBRXJHLFFBQVEsQ0FBQywwQkFBMEIsRUFBRTtJQUNuQyxFQUFFLENBQUMsbUNBQW1DLEVBQUU7UUFDdEMsTUFBTSxDQUFDLEdBQ0wsb1hBQW9YLENBQUM7UUFDdlgsTUFBTSxRQUFRLEdBQ1osb1hBQW9YLENBQUM7UUFDdlgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLHFDQUFzQixFQUFDLHNCQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFO1lBQ2pGLGlIQUFpSDtZQUNqSCxpSEFBaUg7WUFDakgsaUhBQWlIO1NBQ2xILENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxXQUFXLENBQ2hCLElBQUEscUNBQXNCLEVBQ3BCLHNCQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsRUFDbEMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQ3hCLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUN6QixDQUFDLFFBQVEsRUFBRSxFQUNaLFFBQVEsQ0FDVCxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5pbXBvcnQgKiBhcyB1dHhvbGliIGZyb20gJ0BiaXRnby91dHhvLWxpYic7XG5pbXBvcnQgeyBEZXNjcmlwdG9yIH0gZnJvbSAnQGJpdGdvL3dhc20tdXR4byc7XG5cbmltcG9ydCB7IGNvbnZlcnREZXNjcmlwdG9yWHB1YnMsIGdldFhwdWJzRnJvbURlc2NyaXB0b3IgfSBmcm9tICcuLi9zcmMvY29tbWFuZHMvd2FsbGV0L2NtZENyZWF0ZS5qcyc7XG5cbmRlc2NyaWJlKCdjb252ZXJ0RGVzY3JpcHRvck5ldHdvcmsnLCBmdW5jdGlvbiAoKSB7XG4gIGl0KCdzaG91bGQgY29udmVydCBkZXNjcmlwdG9yIG5ldHdvcmsnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgdiA9XG4gICAgICAnd3NoKG11bHRpKDIseHB1YjY2MU15TXdBcVJiY0ZWRzJvU0h0MVA5WmdqeUJtVGZFbUJGbWpnUkFrTjVCVW1qcWZvdmhDZG9wQXlhaXNMcFVYWkxQOThnWnU4SHh4NzZxNEY2dm9QQ1kyQ2Z4VlBNajN3R011a0hVb2FkLzAvKix4cHViNjYxTXlNd0FxUmJjR25CYnFtS1pVZnQxb05yOUw2R2I2eFNraU5hZnFoYldSdGRacnVwU0NnQ2lkYnNYTnlLWWlQVjVaSHVxdEU1RFJxQ1hpZ2RHbVVucHdTUTJjOThtS2pmaURIRjNVTWYvMC8qLHhwdWI2NjFNeU13QXFSYmNHYnp2emROcWdkRXJUU1RMSzNHWDR4NDdDMUhVMjlZMnI5S1ZiUGEzbkZQczdLWTlnbWZyNzlQclJRbW9BNVgySzdvWkJkeUNlb2Q3SkRZclBpcDk3MVYzUGFNdFJuUS8wLyopKSM5aHNjcTQ3OSc7XG4gICAgY29uc3QgdlRlc3RuZXQgPVxuICAgICAgJ3dzaChtdWx0aSgyLHRwdWJENk56VmJrclloWjRYSFN0RmRHeURKVXcxczRxa3JBSkpvcjU2RVVLNkdxNUU0UVlrMm1uTTVVZVIxZldQcW1pS1RzSGtpQ1NTRTgxZUhiU1Q2eEFncGVxNW9SR0F2MXhkdHJtZnFMNGJUdC8wLyosdHB1YkQ2TnpWYmtyWWhaNFlhTlRIeEplZ2JEUDhWd29LVW1lZWIzNDR2ZHBCY01RQkJKR3c4ZlhNN3NZc2R4SnVVR25XSjF6QXNSaVJLdUc4MWg5N1lVV2V2RjgxMzlMSGZuenVoRzd5TUVZREVXLzAvKix0cHViRDZOelZia3JZaFo0WVFCblNwTXZ0WWFEblpZekpSbWFjYWVRWVpMY040SHZiUnpDZmNSOHZoNGhNTWN3REdkNXUzdm0yekhmaEJNNTFKSkFhVnBTWUY1UU1wSkE1RlVOZ3k1VDlicGozcWQvMC8qKSkjaGhnazB5cnYnO1xuICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoZ2V0WHB1YnNGcm9tRGVzY3JpcHRvcihEZXNjcmlwdG9yLmZyb21TdHJpbmcodiwgJ3N0cmluZycpKSwgW1xuICAgICAgJ3hwdWI2NjFNeU13QXFSYmNGVkcyb1NIdDFQOVpnanlCbVRmRW1CRm1qZ1JBa041QlVtanFmb3ZoQ2RvcEF5YWlzTHBVWFpMUDk4Z1p1OEh4eDc2cTRGNnZvUENZMkNmeFZQTWozd0dNdWtIVW9hZCcsXG4gICAgICAneHB1YjY2MU15TXdBcVJiY0duQmJxbUtaVWZ0MW9OcjlMNkdiNnhTa2lOYWZxaGJXUnRkWnJ1cFNDZ0NpZGJzWE55S1lpUFY1Wkh1cXRFNURScUNYaWdkR21VbnB3U1EyYzk4bUtqZmlESEYzVU1mJyxcbiAgICAgICd4cHViNjYxTXlNd0FxUmJjR2J6dnpkTnFnZEVyVFNUTEszR1g0eDQ3QzFIVTI5WTJyOUtWYlBhM25GUHM3S1k5Z21mcjc5UHJSUW1vQTVYMks3b1pCZHlDZW9kN0pEWXJQaXA5NzFWM1BhTXRSblEnLFxuICAgIF0pO1xuXG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKFxuICAgICAgY29udmVydERlc2NyaXB0b3JYcHVicyhcbiAgICAgICAgRGVzY3JpcHRvci5mcm9tU3RyaW5nKHYsICdzdHJpbmcnKSxcbiAgICAgICAgdXR4b2xpYi5uZXR3b3Jrcy5iaXRjb2luLFxuICAgICAgICB1dHhvbGliLm5ldHdvcmtzLnRlc3RuZXRcbiAgICAgICkudG9TdHJpbmcoKSxcbiAgICAgIHZUZXN0bmV0XG4gICAgKTtcbiAgfSk7XG59KTtcbiJdfQ==