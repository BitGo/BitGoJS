use miniscript::{
    bitcoin::{PublicKey, Script, XOnlyPublicKey}, Legacy, Miniscript, Segwitv0, Tap
};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn miniscript_from_script_legacy(script: &[u8]) -> Result<String, js_sys::Error> {
    let script = Script::from_bytes(script);
    Miniscript::<PublicKey, Legacy>::parse(script)
        .map(|ms| ms.to_string())
        .map_err(|e| js_sys::Error::new(&format!("{:?}", e)))
}

#[wasm_bindgen]
pub fn miniscript_from_script_segwit_v0(script: &[u8]) -> Result<String, js_sys::Error> {
    let script = Script::from_bytes(script);
    Miniscript::<PublicKey, Segwitv0>::parse(script)
        .map(|ms| ms.to_string())
        .map_err(|e| js_sys::Error::new(&format!("{:?}", e)))
}

#[wasm_bindgen]
pub fn miniscript_from_string_tap(script: &[u8]) -> Result<String, js_sys::Error> {
    let script = Script::from_bytes(script);
    Miniscript::<XOnlyPublicKey, Tap>::parse(script)
        .map(|ms| ms.to_string())
        .map_err(|e| js_sys::Error::new(&format!("{:?}", e)))
}