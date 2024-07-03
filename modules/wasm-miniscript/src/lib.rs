use std::str::FromStr;
use std::sync::Arc;
use js_sys::Array;
use miniscript::{AbsLockTime, bitcoin::XOnlyPublicKey, Miniscript, RelLockTime, Tap, Terminal, hash256, Threshold, ScriptContext, MiniscriptKey, Segwitv0, Legacy, FromStrKey, Descriptor};
use miniscript::bitcoin::hashes::{hash160, ripemd160};
use miniscript::bitcoin::PublicKey;
use miniscript::descriptor::{ShInner, SortedMultiVec, TapTree, Tr, WshInner};
use wasm_bindgen::{prelude::*};

trait TryIntoJsValue {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue>;
}

macro_rules! js_obj {
    ( $( $key:expr => $value:expr ),* ) => {{
        let obj = js_sys::Object::new();
        $(
            js_sys::Reflect::set(&obj, &$key.into(), &$value.try_to_js_value()?.into())?;
        )*
        Ok(Into::<JsValue>::into(obj)) as Result<JsValue, JsValue>
    }};
}

macro_rules! js_arr {
    ( $( $value:expr ),* ) => {{
        let arr = js_sys::Array::new();
        $(
            arr.push(&$value.try_to_js_value()?);
        )*
        Into::<JsValue>::into(arr) as JsValue
    }};
}


impl TryIntoJsValue for JsValue {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(self.clone())
    }
}

impl<T: TryIntoJsValue> TryIntoJsValue for Arc<T> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        self.as_ref().try_to_js_value()
    }
}

impl TryIntoJsValue for String {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_str(self))
    }
}

// array of TryToJsValue
impl<T: TryIntoJsValue> TryIntoJsValue for Vec<T> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        let arr = Array::new();
        for item in self.iter() {
            arr.push(&item.try_to_js_value()?);
        }
        Ok(arr.into())
    }
}

impl<T: TryIntoJsValue> TryIntoJsValue for Option<T> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        match self {
            Some(v) => v.try_to_js_value(),
            None => Ok(JsValue::NULL)
        }
    }
}

impl TryIntoJsValue for XOnlyPublicKey {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_str(&self.to_string()))
    }
}

impl TryIntoJsValue for PublicKey {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_str(&self.to_string()))
    }
}

impl TryIntoJsValue for AbsLockTime {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_f64(self.to_consensus_u32() as f64))
    }
}

impl TryIntoJsValue for RelLockTime {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_str(&self.to_string()))
    }
}

impl TryIntoJsValue for ripemd160::Hash {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_str(&self.to_string()))
    }
}

impl TryIntoJsValue for hash160::Hash {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_str(&self.to_string()))
    }
}

impl TryIntoJsValue for hash256::Hash {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_str(&self.to_string()))
    }
}

impl TryIntoJsValue for usize {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_f64(*self as f64))
    }
}

impl<T: TryIntoJsValue, const MAX: usize> TryIntoJsValue for Threshold<T, MAX> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        let mut arr = Array::new();
        for v in self.iter() {
            arr.push(&v.try_to_js_value()?);
        }
        Ok(arr.into())
    }
}

impl<Pk: MiniscriptKey + TryIntoJsValue, Ctx: ScriptContext> TryIntoJsValue for Miniscript<Pk, Ctx> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        self.node.try_to_js_value()
    }
}


impl<Pk: MiniscriptKey + TryIntoJsValue, Ctx: ScriptContext> TryIntoJsValue for Terminal<Pk, Ctx> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        match self {
            Terminal::True => Ok(JsValue::TRUE),
            Terminal::False => Ok(JsValue::FALSE),
            Terminal::PkK(pk) => js_obj!("PkK" => pk),
            Terminal::PkH(pk) => js_obj!("PkH" => pk),
            Terminal::RawPkH(pkh) => js_obj!("RawPkH" => pkh),
            Terminal::After(v) => js_obj!("After" => js_obj!("absLockTime" => v)?),
            Terminal::Older(v) => js_obj!("Older" => js_obj!("relLockTime" => v)?),
            Terminal::Sha256(hash) => js_obj!("Sha256" => hash.to_string()),
            Terminal::Hash256(hash) => js_obj!("Hash256" => hash.to_string()),
            Terminal::Ripemd160(hash) => js_obj!("Ripemd160" => hash.to_string()),
            Terminal::Hash160(hash) => js_obj!("Hash160" => hash.to_string()),
            Terminal::Alt(node) => js_obj!("Alt" => node),
            Terminal::Swap(node) => js_obj!("Swap" => node),
            Terminal::Check(node) => js_obj!("Check" => node),
            Terminal::DupIf(node) => js_obj!("DupIf" => node),
            Terminal::Verify(node) => js_obj!("Verify" => node),
            Terminal::NonZero(node) => js_obj!("NonZero" => node),
            Terminal::ZeroNotEqual(node) => js_obj!("ZeroNotEqual" => node),
            Terminal::AndV(a, b) => js_obj!("AndV" => js_arr!(a, b)),
            Terminal::AndB(a, b) => js_obj!("AndB" => js_arr!(a, b)),
            Terminal::AndOr(a, b, c) => js_obj!("AndOr" => js_arr!(a, b, c)),
            Terminal::OrB(a, b) => js_obj!("OrB" => js_arr!(a, b)),
            Terminal::OrD(a, b) => js_obj!("OrD" => js_arr!(a, b)),
            Terminal::OrC(a, b) => js_obj!("OrC" => js_arr!(a, b)),
            Terminal::OrI(a, b) => js_obj!("OrI" => js_arr!(a, b)),
            Terminal::Thresh(t) => js_obj!("Thresh" => t),
            Terminal::Multi(pks) => js_obj!("Multi" => pks),
            Terminal::MultiA(pks) => js_obj!("MultiA" => pks),
        }
    }
}

fn to_js_value<Pk: MiniscriptKey + FromStrKey + TryIntoJsValue, Ctx: ScriptContext>(script: &str) -> Result<JsValue, JsValue> {
    Miniscript::<Pk, Ctx>::from_str(script)
        .map_err(|e| js_sys::Error::new(&format!("{:?}", e)))?
        .try_to_js_value()
}

#[wasm_bindgen]
pub fn miniscript_nodes_from_string(script: &str, context_type: &str) -> Result<JsValue, JsValue> {
    match context_type {
        "tap" => to_js_value::<XOnlyPublicKey, Tap>(script),
        "segwit" => to_js_value::<PublicKey, Segwitv0>(script),
        "legacy" => to_js_value::<PublicKey, Legacy>(script),
        _ => Err(JsValue::from_str("Invalid context type"))
    }
}

impl<Pk: MiniscriptKey + TryIntoJsValue, Ctx: ScriptContext> TryIntoJsValue for SortedMultiVec<Pk, Ctx> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        js_obj!(
            "k" => self.k(),
            "n" => self.n(),
            "pks" => self.pks().to_vec()
        )
    }
}

impl<Pk: MiniscriptKey + TryIntoJsValue> TryIntoJsValue for ShInner<Pk> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        match self {
            ShInner::Wsh(v) => js_obj!("Wsh" => v.as_inner()),
            ShInner::Wpkh(v) => js_obj!("Wpkh" => v.as_inner()),
            ShInner::SortedMulti(v) => js_obj!("SortedMulti" => v),
            ShInner::Ms(v) => js_obj!("Ms" => v),
        }
    }
}

impl<Pk: MiniscriptKey + TryIntoJsValue> TryIntoJsValue for WshInner<Pk> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        match self {
            WshInner::SortedMulti(v) => js_obj!("SortedMulti" => v),
            WshInner::Ms(v) => js_obj!("Ms" => v),
        }
    }
}

impl<Pk: MiniscriptKey + TryIntoJsValue> TryIntoJsValue for Tr<Pk> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        js_obj!(
            "internalKey" => self.internal_key(),
            "tree" => self.tap_tree()
        )
    }
}

impl<Pk: MiniscriptKey + TryIntoJsValue> TryIntoJsValue for TapTree<Pk> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        match self {
            TapTree::Tree { left, right, .. } => js_obj!("Tree" => js_arr!(left, right)),
            TapTree::Leaf(ms) => ms.try_to_js_value()
        }
    }
}

impl<Pk: MiniscriptKey + TryIntoJsValue> TryIntoJsValue for Descriptor<Pk> {
    fn try_to_js_value(&self) -> Result<JsValue, JsValue> {
        match self {
            Descriptor::Bare(v) => js_obj!("Bare" => v.as_inner()),
            Descriptor::Pkh(v) => js_obj!("Pkh" => v.as_inner()),
            Descriptor::Wpkh(v) => js_obj!("Wpkh" => v.as_inner()),
            Descriptor::Sh(v) => js_obj!("Sh" => v.as_inner()),
            Descriptor::Wsh(v) => js_obj!("Wsh" => v.as_inner()),
            Descriptor::Tr(v) => js_obj!("Tr" => v),
        }
    }
}

#[wasm_bindgen]
pub fn descriptor_nodes_from_string(descriptor: &str) -> Result<JsValue, JsValue> {
    let desc = Descriptor::<String>::from_str(descriptor)
        .map_err(|e| js_sys::Error::new(&format!("{:?}", e)))?;
    TryIntoJsValue::try_to_js_value(&desc)
}