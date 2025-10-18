# BIP327 reference implementation with support for deprecated BitGo `p2tr`
# aggregation method (see key_agg_bitgo_p2tr)
#
# WARNING: This implementation is for demonstration purposes only and _not_ to
# be used in production environments. The code is vulnerable to timing attacks,
# for example.

from typing import List, Optional, Tuple, NewType, NamedTuple
import hashlib
import secrets
import time

#
# The following helper functions were copied from the BIP-340 reference implementation:
# https://github.com/bitcoin/bips/blob/master/bip-0340/reference.py
#

p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

# Points are tuples of X and Y coordinates and the point at infinity is
# represented by the None keyword.
G = (0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798, 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8)

Point = Tuple[int, int]

# This implementation can be sped up by storing the midstate after hashing
# tag_hash instead of rehashing it all the time.
def tagged_hash(tag: str, msg: bytes) -> bytes:
    tag_hash = hashlib.sha256(tag.encode()).digest()
    return hashlib.sha256(tag_hash + tag_hash + msg).digest()

def is_infinite(P: Optional[Point]) -> bool:
    return P is None

def x(P: Point) -> int:
    assert not is_infinite(P)
    return P[0]

def y(P: Point) -> int:
    assert not is_infinite(P)
    return P[1]

def point_add(P1: Optional[Point], P2: Optional[Point]) -> Optional[Point]:
    if P1 is None:
        return P2
    if P2 is None:
        return P1
    if (x(P1) == x(P2)) and (y(P1) != y(P2)):
        return None
    if P1 == P2:
        lam = (3 * x(P1) * x(P1) * pow(2 * y(P1), p - 2, p)) % p
    else:
        lam = ((y(P2) - y(P1)) * pow(x(P2) - x(P1), p - 2, p)) % p
    x3 = (lam * lam - x(P1) - x(P2)) % p
    return (x3, (lam * (x(P1) - x3) - y(P1)) % p)

def point_mul(P: Optional[Point], n: int) -> Optional[Point]:
    R = None
    for i in range(256):
        if (n >> i) & 1:
            R = point_add(R, P)
        P = point_add(P, P)
    return R

def bytes_from_int(x: int) -> bytes:
    return x.to_bytes(32, byteorder="big")

def lift_x(b: bytes) -> Optional[Point]:
    x = int_from_bytes(b)
    if x >= p:
        return None
    y_sq = (pow(x, 3, p) + 7) % p
    y = pow(y_sq, (p + 1) // 4, p)
    if pow(y, 2, p) != y_sq:
        return None
    return (x, y if y & 1 == 0 else p-y)

def int_from_bytes(b: bytes) -> int:
    return int.from_bytes(b, byteorder="big")

def has_even_y(P: Point) -> bool:
    assert not is_infinite(P)
    return y(P) % 2 == 0

def schnorr_verify(msg: bytes, pubkey: bytes, sig: bytes) -> bool:
    if len(msg) != 32:
        raise ValueError('The message must be a 32-byte array.')
    if len(pubkey) != 32:
        raise ValueError('The public key must be a 32-byte array.')
    if len(sig) != 64:
        raise ValueError('The signature must be a 64-byte array.')
    P = lift_x(pubkey)
    r = int_from_bytes(sig[0:32])
    s = int_from_bytes(sig[32:64])
    if (P is None) or (r >= p) or (s >= n):
        return False
    e = int_from_bytes(tagged_hash("BIP0340/challenge", sig[0:32] + pubkey + msg)) % n
    R = point_add(point_mul(G, s), point_mul(P, n - e))
    if (R is None) or (not has_even_y(R)) or (x(R) != r):
        return False
    return True

#
# End of helper functions copied from BIP-340 reference implementation.
#

PlainPk = NewType('PlainPk', bytes)
XonlyPk = NewType('XonlyPk', bytes)

# There are two types of exceptions that can be raised by this implementation:
#   - ValueError for indicating that an input doesn't conform to some function
#     precondition (e.g. an input array is the wrong length, a serialized
#     representation doesn't have the correct format).
#   - InvalidContributionError for indicating that a signer (or the
#     aggregator) is misbehaving in the protocol.
#
# Assertions are used to (1) satisfy the type-checking system, and (2) check for
# inconvenient events that can't happen except with negligible probability (e.g.
# output of a hash function is 0) and can't be manually triggered by any
# signer.

# This exception is raised if a party (signer or nonce aggregator) sends invalid
# values. Actual implementations should not crash when receiving invalid
# contributions. Instead, they should hold the offending party accountable.
class InvalidContributionError(Exception):
    def __init__(self, signer, contrib):
        self.signer = signer
        # contrib is one of "pubkey", "pubnonce", "aggnonce", or "psig".
        self.contrib = contrib

infinity = None

def xbytes(P: Point) -> bytes:
    return bytes_from_int(x(P))

def cbytes(P: Point) -> bytes:
    a = b'\x02' if has_even_y(P) else b'\x03'
    return a + xbytes(P)

def cbytes_ext(P: Optional[Point]) -> bytes:
    if is_infinite(P):
        return (0).to_bytes(33, byteorder='big')
    assert P is not None
    return cbytes(P)

def point_negate(P: Optional[Point]) -> Optional[Point]:
    if P is None:
        return P
    return (x(P), p - y(P))

def cpoint(x: bytes) -> Point:
    if len(x) != 33:
        raise ValueError('x is not a valid compressed point.')
    P = lift_x(x[1:33])
    if P is None:
        raise ValueError('x is not a valid compressed point.')
    if x[0] == 2:
        return P
    elif x[0] == 3:
        P = point_negate(P)
        assert P is not None
        return P
    else:
        raise ValueError('x is not a valid compressed point.')

def cpoint_ext(x: bytes) -> Optional[Point]:
    if x == (0).to_bytes(33, 'big'):
        return None
    else:
        return cpoint(x)

# Return the plain public key corresponding to a given secret key
def individual_pk(seckey: bytes) -> PlainPk:
    d0 = int_from_bytes(seckey)
    if not (1 <= d0 <= n - 1):
        raise ValueError('The secret key must be an integer in the range 1..n-1.')
    P = point_mul(G, d0)
    assert P is not None
    return PlainPk(cbytes(P))

def key_sort(pubkeys: List[PlainPk]) -> List[PlainPk]:
    pubkeys.sort()
    return pubkeys

KeyAggContext = NamedTuple('KeyAggContext', [('Q', Point),
                                             ('gacc', int),
                                             ('tacc', int)])

def get_xonly_pk(keyagg_ctx: KeyAggContext) -> XonlyPk:
    Q, _, _ = keyagg_ctx
    return XonlyPk(xbytes(Q))

def key_agg(pubkeys: List[bytes]) -> KeyAggContext:
    for pk in pubkeys:
        if len(pk) != len(pubkeys[0]):
            raise ValueError('all pubkeys must be the same length')

    pk2 = get_second_key(pubkeys)
    u = len(pubkeys)
    Q = infinity
    for i in range(u):
        try:
            # if the pubkey is 32 bytes, it is an xonly pubkey
            if len(pubkeys[i]) == 32:
                P_i = lift_x(pubkeys[i])
                if P_i is None:
                    raise ValueError('invalid xonly pubkey')
            else:
                P_i = cpoint(pubkeys[i])
        except ValueError:
            raise InvalidContributionError(i, "pubkey")
        a_i = key_agg_coeff_internal(pubkeys, pubkeys[i], pk2)
        Q = point_add(Q, point_mul(P_i, a_i))
    # Q is not the point at infinity except with negligible probability.
    assert(Q is not None)
    gacc = 1
    tacc = 0
    return KeyAggContext(Q, gacc, tacc)

def key_agg_bitgo_p2tr_legacy(pubkeys: List[PlainPk]) -> KeyAggContext:
    # This is the legacy algorithm used by the bitgo 'p2tr' output script type (chain 30, 31)
    # Here, we convert the pubkeys to xonly first and then sort.
    # This corresponds to an older variant of the musig2 scheme.
    # The change from 32-byte to 33-byte keys was made in https://github.com/jonasnick/bips/pull/37
    # For xonly mode, normalize all pubkeys to use only x-coordinate in hashes
    # by converting them to 32-byte x-only format
    pubkeys = [pk[-32:] for pk in pubkeys]

    # sort the keys after xonly conversion, before aggregation
    pubkeys = key_sort(pubkeys)

    return key_agg(pubkeys)

def hash_keys(pubkeys: List[PlainPk]) -> bytes:
    return tagged_hash('KeyAgg list', b''.join(pubkeys))

def get_second_key(pubkeys: List[PlainPk]) -> PlainPk:
    u = len(pubkeys)
    for j in range(1, u):
        if pubkeys[j] != pubkeys[0]:
            return pubkeys[j]
    return PlainPk(b'\x00'*33)

def key_agg_coeff(pubkeys: List[PlainPk], pk_: PlainPk) -> int:
    pk2 = get_second_key(pubkeys)
    return key_agg_coeff_internal(pubkeys, pk_, pk2)

def key_agg_coeff_internal(pubkeys: List[PlainPk], pk_: PlainPk, pk2: PlainPk) -> int:
    L = hash_keys(pubkeys)
    if pk_ == pk2:
        return 1
    return int_from_bytes(tagged_hash('KeyAgg coefficient', L + pk_)) % n

def apply_tweak(keyagg_ctx: KeyAggContext, tweak: bytes, is_xonly: bool) -> KeyAggContext:
    if len(tweak) != 32:
        raise ValueError('The tweak must be a 32-byte array.')
    Q, gacc, tacc = keyagg_ctx
    if is_xonly and not has_even_y(Q):
        g = n - 1
    else:
        g = 1
    t = int_from_bytes(tweak)
    if t >= n:
        raise ValueError('The tweak must be less than n.')
    Q_ = point_add(point_mul(Q, g), point_mul(G, t))
    if Q_ is None:
        raise ValueError('The result of tweaking cannot be infinity.')
    gacc_ = g * gacc % n
    tacc_ = (t + g * tacc) % n
    return KeyAggContext(Q_, gacc_, tacc_)

def bytes_xor(a: bytes, b: bytes) -> bytes:
    return bytes(x ^ y for x, y in zip(a, b))

def nonce_hash(rand: bytes, pk: PlainPk, aggpk: XonlyPk, i: int, msg_prefixed: bytes, extra_in: bytes) -> int:
    buf = b''
    buf += rand
    buf += len(pk).to_bytes(1, 'big')
    buf += pk
    buf += len(aggpk).to_bytes(1, 'big')
    buf += aggpk
    buf += msg_prefixed
    buf += len(extra_in).to_bytes(4, 'big')
    buf += extra_in
    buf += i.to_bytes(1, 'big')
    return int_from_bytes(tagged_hash('MuSig/nonce', buf))

def nonce_gen_internal(rand_: bytes, sk: Optional[bytes], pk: PlainPk, aggpk: Optional[XonlyPk], msg: Optional[bytes], extra_in: Optional[bytes]) -> Tuple[bytearray, bytes]:
    if sk is not None:
        rand = bytes_xor(sk, tagged_hash('MuSig/aux', rand_))
    else:
        rand = rand_
    if aggpk is None:
        aggpk = XonlyPk(b'')
    if msg is None:
        msg_prefixed = b'\x00'
    else:
        msg_prefixed = b'\x01'
        msg_prefixed += len(msg).to_bytes(8, 'big')
        msg_prefixed += msg
    if extra_in is None:
        extra_in = b''
    k_1 = nonce_hash(rand, pk, aggpk, 0, msg_prefixed, extra_in) % n
    k_2 = nonce_hash(rand, pk, aggpk, 1, msg_prefixed, extra_in) % n
    # k_1 == 0 or k_2 == 0 cannot occur except with negligible probability.
    assert k_1 != 0
    assert k_2 != 0
    R_s1 = point_mul(G, k_1)
    R_s2 = point_mul(G, k_2)
    assert R_s1 is not None
    assert R_s2 is not None
    pubnonce = cbytes(R_s1) + cbytes(R_s2)
    secnonce = bytearray(bytes_from_int(k_1) + bytes_from_int(k_2) + pk)
    return secnonce, pubnonce

def nonce_gen(sk: Optional[bytes], pk: PlainPk, aggpk: Optional[XonlyPk], msg: Optional[bytes], extra_in: Optional[bytes]) -> Tuple[bytearray, bytes]:
    if sk is not None and len(sk) != 32:
        raise ValueError('The optional byte array sk must have length 32.')
    if aggpk is not None and len(aggpk) != 32:
        raise ValueError('The optional byte array aggpk must have length 32.')
    rand_ = secrets.token_bytes(32)
    return nonce_gen_internal(rand_, sk, pk, aggpk, msg, extra_in)

def nonce_agg(pubnonces: List[bytes]) -> bytes:
    u = len(pubnonces)
    aggnonce = b''
    for j in (1, 2):
        R_j = infinity
        for i in range(u):
            try:
                R_ij = cpoint(pubnonces[i][(j-1)*33:j*33])
            except ValueError:
                raise InvalidContributionError(i, "pubnonce")
            R_j = point_add(R_j, R_ij)
        aggnonce += cbytes_ext(R_j)
    return aggnonce

SessionContext = NamedTuple('SessionContext', [('aggnonce', bytes),
                                               ('pubkeys', List[PlainPk]),
                                               ('tweaks', List[bytes]),
                                               ('is_xonly', List[bool]),
                                               ('msg', bytes)])

def key_agg_and_tweak(pubkeys: List[PlainPk], tweaks: List[bytes], is_xonly: List[bool]) -> KeyAggContext:
    if len(tweaks) != len(is_xonly):
        raise ValueError('The `tweaks` and `is_xonly` arrays must have the same length.')
    keyagg_ctx = key_agg(pubkeys)
    v = len(tweaks)
    for i in range(v):
        keyagg_ctx = apply_tweak(keyagg_ctx, tweaks[i], is_xonly[i])
    return keyagg_ctx

def get_session_values(session_ctx: SessionContext) -> Tuple[Point, int, int, int, Point, int]:
    (aggnonce, pubkeys, tweaks, is_xonly, msg) = session_ctx
    Q, gacc, tacc = key_agg_and_tweak(pubkeys, tweaks, is_xonly)
    b = int_from_bytes(tagged_hash('MuSig/noncecoef', aggnonce + xbytes(Q) + msg)) % n
    try:
        R_1 = cpoint_ext(aggnonce[0:33])
        R_2 = cpoint_ext(aggnonce[33:66])
    except ValueError:
        # Nonce aggregator sent invalid nonces
        raise InvalidContributionError(None, "aggnonce")
    R_ = point_add(R_1, point_mul(R_2, b))
    R = R_ if not is_infinite(R_) else G
    assert R is not None
    e = int_from_bytes(tagged_hash('BIP0340/challenge', xbytes(R) + xbytes(Q) + msg)) % n
    return (Q, gacc, tacc, b, R, e)

def get_session_key_agg_coeff(session_ctx: SessionContext, P: Point) -> int:
    (_, pubkeys, _, _, _) = session_ctx
    pk = PlainPk(cbytes(P))
    if pk not in pubkeys and pk[-32:] not in pubkeys:
        raise ValueError('The signer\'s pubkey must be included in the list of pubkeys.')
    # If pubkeys are x-only, use x-only for coefficient calculation
    if len(pubkeys[0]) == 32:
        pk_for_coeff = pk[-32:]
    else:
        pk_for_coeff = pk
    return key_agg_coeff(pubkeys, pk_for_coeff)

def sign(secnonce: bytearray, sk: bytes, session_ctx: SessionContext) -> bytes:
    (Q, gacc, _, b, R, e) = get_session_values(session_ctx)
    k_1_ = int_from_bytes(secnonce[0:32])
    k_2_ = int_from_bytes(secnonce[32:64])
    # Overwrite the secnonce argument with zeros such that subsequent calls of
    # sign with the same secnonce raise a ValueError.
    secnonce[:64] = bytearray(b'\x00'*64)
    if not 0 < k_1_ < n:
        raise ValueError('first secnonce value is out of range.')
    if not 0 < k_2_ < n:
        raise ValueError('second secnonce value is out of range.')
    k_1 = k_1_ if has_even_y(R) else n - k_1_
    k_2 = k_2_ if has_even_y(R) else n - k_2_
    d_ = int_from_bytes(sk)
    if not 0 < d_ < n:
        raise ValueError('secret key value is out of range.')
    P = point_mul(G, d_)
    assert P is not None
    pk = cbytes(P)
    if not pk == secnonce[64:97] and not pk[-32:] == secnonce[64:97]:
        raise ValueError('Public key does not match nonce_gen argument')
    a = get_session_key_agg_coeff(session_ctx, P)
    g = 1 if has_even_y(Q) else n - 1
    d = g * gacc * d_ % n
    s = (k_1 + b * k_2 + e * a * d) % n
    psig = bytes_from_int(s)
    R_s1 = point_mul(G, k_1_)
    R_s2 = point_mul(G, k_2_)
    assert R_s1 is not None
    assert R_s2 is not None
    pubnonce = cbytes(R_s1) + cbytes(R_s2)
    # Optional correctness check. The result of signing should pass signature verification.
    assert partial_sig_verify_internal(psig, pubnonce, pk, session_ctx)
    return psig

def det_nonce_hash(sk_: bytes, aggothernonce: bytes, aggpk: bytes, msg: bytes, i: int) -> int:
    buf = b''
    buf += sk_
    buf += aggothernonce
    buf += aggpk
    buf += len(msg).to_bytes(8, 'big')
    buf += msg
    buf += i.to_bytes(1, 'big')
    return int_from_bytes(tagged_hash('MuSig/deterministic/nonce', buf))

def deterministic_sign(sk: bytes, aggothernonce: bytes, pubkeys: List[PlainPk], tweaks: List[bytes], is_xonly: List[bool], msg: bytes, rand: Optional[bytes]) -> Tuple[bytes, bytes]:
    if rand is not None:
        sk_ = bytes_xor(sk, tagged_hash('MuSig/aux', rand))
    else:
        sk_ = sk
    aggpk = get_xonly_pk(key_agg_and_tweak(pubkeys, tweaks, is_xonly))

    k_1 = det_nonce_hash(sk_, aggothernonce, aggpk, msg, 0) % n
    k_2 = det_nonce_hash(sk_, aggothernonce, aggpk, msg, 1) % n
    # k_1 == 0 or k_2 == 0 cannot occur except with negligible probability.
    assert k_1 != 0
    assert k_2 != 0

    R_s1 = point_mul(G, k_1)
    R_s2 = point_mul(G, k_2)
    assert R_s1 is not None
    assert R_s2 is not None
    pubnonce = cbytes(R_s1) + cbytes(R_s2)
    secnonce = bytearray(bytes_from_int(k_1) + bytes_from_int(k_2) + individual_pk(sk))
    try:
        aggnonce = nonce_agg([pubnonce, aggothernonce])
    except Exception:
        raise InvalidContributionError(None, "aggothernonce")
    session_ctx = SessionContext(aggnonce, pubkeys, tweaks, is_xonly, msg)
    psig = sign(secnonce, sk, session_ctx)
    return (pubnonce, psig)

def partial_sig_verify(psig: bytes, pubnonces: List[bytes], pubkeys: List[PlainPk], tweaks: List[bytes], is_xonly: List[bool], msg: bytes, i: int) -> bool:
    if len(pubnonces) != len(pubkeys):
        raise ValueError('The `pubnonces` and `pubkeys` arrays must have the same length.')
    if len(tweaks) != len(is_xonly):
        raise ValueError('The `tweaks` and `is_xonly` arrays must have the same length.')
    aggnonce = nonce_agg(pubnonces)
    session_ctx = SessionContext(aggnonce, pubkeys, tweaks, is_xonly, msg)
    return partial_sig_verify_internal(psig, pubnonces[i], pubkeys[i], session_ctx)

def partial_sig_verify_internal(psig: bytes, pubnonce: bytes, pk: bytes, session_ctx: SessionContext) -> bool:
    (Q, gacc, _, b, R, e) = get_session_values(session_ctx)
    s = int_from_bytes(psig)
    if s >= n:
        return False
    R_s1 = cpoint(pubnonce[0:33])
    R_s2 = cpoint(pubnonce[33:66])
    Re_s_ = point_add(R_s1, point_mul(R_s2, b))
    Re_s = Re_s_ if has_even_y(R) else point_negate(Re_s_)
    # prepend a 0x02 if the pk is 32 bytes
    P = cpoint(b'\x02' + pk) if len(pk) == 32 else cpoint(pk)
    a = get_session_key_agg_coeff(session_ctx, P)
    g = 1 if has_even_y(Q) else n - 1
    g_ = g * gacc % n
    return point_mul(G, s) == point_add(Re_s, point_mul(P, e * a * g_ % n))

def partial_sig_agg(psigs: List[bytes], session_ctx: SessionContext) -> bytes:
    (Q, _, tacc, _, R, e) = get_session_values(session_ctx)
    s = 0
    u = len(psigs)
    for i in range(u):
        s_i = int_from_bytes(psigs[i])
        if s_i >= n:
            raise InvalidContributionError(i, "psig")
        s = (s + s_i) % n
    g = 1 if has_even_y(Q) else n - 1
    s = (s + e * g * tacc) % n
    return xbytes(R) + bytes_from_int(s)
#
# The following code is only used for testing.
#

import json
import os
import sys

def fromhex_all(l):
    return [bytes.fromhex(l_i) for l_i in l]

# Check if calling `try_fn` raises an exception. If yes, examine it with `except_fn`.
def assert_raises(exception, try_fn, except_fn):
    raised = False
    try:
        try_fn()
    except exception as e:
        raised = True
        assert(except_fn(e))
    except BaseException:
        raise AssertionError("Wrong exception raised in a test.")
    if not raised:
        raise AssertionError("Exception was _not_ raised in a test where it was required.")

def get_error_details(test_case):
    error = test_case["error"]
    if error["type"] == "invalid_contribution":
        exception = InvalidContributionError
        if "contrib" in error:
            except_fn = lambda e: e.signer == error["signer"] and e.contrib == error["contrib"]
        else:
            except_fn = lambda e: e.signer == error["signer"]
    elif error["type"] == "value":
        exception = ValueError
        except_fn = lambda e: str(e) == error["message"]
    else:
        raise RuntimeError(f"Invalid error type: {error['type']}")
    return exception, except_fn

def test_key_sort_vectors() -> None:
    with open(os.path.join(sys.path[0], 'vectors', 'key_sort_vectors.json')) as f:
        test_data = json.load(f)

    X = fromhex_all(test_data["pubkeys"])
    X_sorted = fromhex_all(test_data["sorted_pubkeys"])

    assert key_sort(X) == X_sorted

def test_key_agg_vectors() -> None:
    with open(os.path.join(sys.path[0], 'vectors', 'key_agg_vectors.json')) as f:
        test_data = json.load(f)

    X = fromhex_all(test_data["pubkeys"])
    T = fromhex_all(test_data["tweaks"])
    valid_test_cases = test_data["valid_test_cases"]
    error_test_cases = test_data["error_test_cases"]

    for test_case in valid_test_cases:
        pubkeys = [X[i] for i in test_case["key_indices"]]
        expected = bytes.fromhex(test_case["expected"])

        assert get_xonly_pk(key_agg(pubkeys)) == expected

    for test_case in error_test_cases:
        exception, except_fn = get_error_details(test_case)

        pubkeys = [X[i] for i in test_case["key_indices"]]
        tweaks = [T[i] for i in test_case["tweak_indices"]]
        is_xonly = test_case["is_xonly"]

        assert_raises(exception, lambda: key_agg_and_tweak(pubkeys, tweaks, is_xonly), except_fn)

def test_nonce_gen_vectors() -> None:
    with open(os.path.join(sys.path[0], 'vectors', 'nonce_gen_vectors.json')) as f:
        test_data = json.load(f)

    for test_case in test_data["test_cases"]:
        def get_value(key) -> bytes:
            return bytes.fromhex(test_case[key])

        def get_value_maybe(key) -> Optional[bytes]:
            if test_case[key] is not None:
                return get_value(key)
            else:
                return None

        rand_ = get_value("rand_")
        sk = get_value_maybe("sk")
        pk = PlainPk(get_value("pk"))
        aggpk = get_value_maybe("aggpk")
        if aggpk is not None:
            aggpk = XonlyPk(aggpk)
        msg = get_value_maybe("msg")
        extra_in = get_value_maybe("extra_in")
        expected_secnonce = get_value("expected_secnonce")
        expected_pubnonce = get_value("expected_pubnonce")

        assert nonce_gen_internal(rand_, sk, pk, aggpk, msg, extra_in) == (expected_secnonce, expected_pubnonce)

def test_nonce_agg_vectors() -> None:
    with open(os.path.join(sys.path[0], 'vectors', 'nonce_agg_vectors.json')) as f:
        test_data = json.load(f)

    pnonce = fromhex_all(test_data["pnonces"])
    valid_test_cases = test_data["valid_test_cases"]
    error_test_cases = test_data["error_test_cases"]

    for test_case in valid_test_cases:
        pubnonces = [pnonce[i] for i in test_case["pnonce_indices"]]
        expected = bytes.fromhex(test_case["expected"])
        assert nonce_agg(pubnonces) == expected

    for test_case in error_test_cases:
        exception, except_fn = get_error_details(test_case)
        pubnonces = [pnonce[i] for i in test_case["pnonce_indices"]]
        assert_raises(exception, lambda: nonce_agg(pubnonces), except_fn)

def test_sign_verify_vectors() -> None:
    with open(os.path.join(sys.path[0], 'vectors', 'sign_verify_vectors.json')) as f:
        test_data = json.load(f)

    sk = bytes.fromhex(test_data["sk"])
    X = fromhex_all(test_data["pubkeys"])
    # The public key corresponding to sk is at index 0
    assert X[0] == individual_pk(sk)

    secnonces = fromhex_all(test_data["secnonces"])
    pnonce = fromhex_all(test_data["pnonces"])
    # The public nonce corresponding to secnonces[0] is at index 0
    k_1 = int_from_bytes(secnonces[0][0:32])
    k_2 = int_from_bytes(secnonces[0][32:64])
    R_s1 = point_mul(G, k_1)
    R_s2 = point_mul(G, k_2)
    assert R_s1 is not None and R_s2 is not None
    assert pnonce[0] == cbytes(R_s1) + cbytes(R_s2)

    aggnonces = fromhex_all(test_data["aggnonces"])
    # The aggregate of the first three elements of pnonce is at index 0
    assert (aggnonces[0] == nonce_agg([pnonce[0], pnonce[1], pnonce[2]]))
    # The aggregate of the first and fourth elements of pnonce is at index 1,
    # which is the infinity point encoded as a zeroed 33-byte array
    assert (aggnonces[1] == nonce_agg([pnonce[0], pnonce[3]]))

    msgs = fromhex_all(test_data["msgs"])

    valid_test_cases = test_data["valid_test_cases"]
    sign_error_test_cases = test_data["sign_error_test_cases"]
    verify_fail_test_cases = test_data["verify_fail_test_cases"]
    verify_error_test_cases = test_data["verify_error_test_cases"]

    for test_case in valid_test_cases:
        pubkeys = [X[i] for i in test_case["key_indices"]]
        pubnonces = [pnonce[i] for i in test_case["nonce_indices"]]
        aggnonce = aggnonces[test_case["aggnonce_index"]]
        # Make sure that pubnonces and aggnonce in the test vector are
        # consistent
        assert nonce_agg(pubnonces) == aggnonce
        msg = msgs[test_case["msg_index"]]
        signer_index = test_case["signer_index"]
        expected = bytes.fromhex(test_case["expected"])

        session_ctx = SessionContext(aggnonce, pubkeys, [], [], msg)
        # WARNING: An actual implementation should _not_ copy the secnonce.
        # Reusing the secnonce, as we do here for testing purposes, can leak the
        # secret key.
        secnonce_tmp = bytearray(secnonces[0])
        assert sign(secnonce_tmp, sk, session_ctx) == expected
        assert partial_sig_verify(expected, pubnonces, pubkeys, [], [], msg, signer_index)

    for test_case in sign_error_test_cases:
        exception, except_fn = get_error_details(test_case)

        pubkeys = [X[i] for i in test_case["key_indices"]]
        aggnonce = aggnonces[test_case["aggnonce_index"]]
        msg = msgs[test_case["msg_index"]]
        secnonce = bytearray(secnonces[test_case["secnonce_index"]])

        session_ctx = SessionContext(aggnonce, pubkeys, [], [], msg)
        assert_raises(exception, lambda: sign(secnonce, sk, session_ctx), except_fn)

    for test_case in verify_fail_test_cases:
        sig = bytes.fromhex(test_case["sig"])
        pubkeys = [X[i] for i in test_case["key_indices"]]
        pubnonces = [pnonce[i] for i in test_case["nonce_indices"]]
        msg = msgs[test_case["msg_index"]]
        signer_index = test_case["signer_index"]

        assert not partial_sig_verify(sig, pubnonces, pubkeys, [], [], msg, signer_index)

    for test_case in verify_error_test_cases:
        exception, except_fn = get_error_details(test_case)

        sig = bytes.fromhex(test_case["sig"])
        pubkeys = [X[i] for i in test_case["key_indices"]]
        pubnonces = [pnonce[i] for i in test_case["nonce_indices"]]
        msg = msgs[test_case["msg_index"]]
        signer_index = test_case["signer_index"]

        assert_raises(exception, lambda: partial_sig_verify(sig, pubnonces, pubkeys, [], [], msg, signer_index), except_fn)

def test_tweak_vectors() -> None:
    with open(os.path.join(sys.path[0], 'vectors', 'tweak_vectors.json')) as f:
        test_data = json.load(f)

    sk = bytes.fromhex(test_data["sk"])
    X = fromhex_all(test_data["pubkeys"])
    # The public key corresponding to sk is at index 0
    assert X[0] == individual_pk(sk)

    secnonce = bytearray(bytes.fromhex(test_data["secnonce"]))
    pnonce = fromhex_all(test_data["pnonces"])
    # The public nonce corresponding to secnonce is at index 0
    k_1 = int_from_bytes(secnonce[0:32])
    k_2 = int_from_bytes(secnonce[32:64])
    R_s1 = point_mul(G, k_1)
    R_s2 = point_mul(G, k_2)
    assert R_s1 is not None and R_s2 is not None
    assert pnonce[0] == cbytes(R_s1) + cbytes(R_s2)

    aggnonce = bytes.fromhex(test_data["aggnonce"])
    # The aggnonce is the aggregate of the first three elements of pnonce
    assert(aggnonce == nonce_agg([pnonce[0], pnonce[1], pnonce[2]]))

    tweak = fromhex_all(test_data["tweaks"])
    msg = bytes.fromhex(test_data["msg"])

    valid_test_cases = test_data["valid_test_cases"]
    error_test_cases = test_data["error_test_cases"]

    for test_case in valid_test_cases:
        pubkeys = [X[i] for i in test_case["key_indices"]]
        pubnonces = [pnonce[i] for i in test_case["nonce_indices"]]
        tweaks = [tweak[i] for i in test_case["tweak_indices"]]
        is_xonly = test_case["is_xonly"]
        signer_index = test_case["signer_index"]
        expected = bytes.fromhex(test_case["expected"])

        session_ctx = SessionContext(aggnonce, pubkeys, tweaks, is_xonly, msg)
        secnonce_tmp = bytearray(secnonce)
        # WARNING: An actual implementation should _not_ copy the secnonce.
        # Reusing the secnonce, as we do here for testing purposes, can leak the
        # secret key.
        assert sign(secnonce_tmp, sk, session_ctx) == expected
        assert partial_sig_verify(expected, pubnonces, pubkeys, tweaks, is_xonly, msg, signer_index)

    for test_case in error_test_cases:
        exception, except_fn = get_error_details(test_case)

        pubkeys = [X[i] for i in test_case["key_indices"]]
        pubnonces = [pnonce[i] for i in test_case["nonce_indices"]]
        tweaks = [tweak[i] for i in test_case["tweak_indices"]]
        is_xonly = test_case["is_xonly"]
        signer_index = test_case["signer_index"]

        session_ctx = SessionContext(aggnonce, pubkeys, tweaks, is_xonly, msg)
        assert_raises(exception, lambda: sign(secnonce, sk, session_ctx), except_fn)

def test_det_sign_vectors() -> None:
    with open(os.path.join(sys.path[0], 'vectors', 'det_sign_vectors.json')) as f:
        test_data = json.load(f)

    sk = bytes.fromhex(test_data["sk"])
    X = fromhex_all(test_data["pubkeys"])
    # The public key corresponding to sk is at index 0
    assert X[0] == individual_pk(sk)

    msgs = fromhex_all(test_data["msgs"])

    valid_test_cases = test_data["valid_test_cases"]
    error_test_cases = test_data["error_test_cases"]

    for test_case in valid_test_cases:
        pubkeys = [X[i] for i in test_case["key_indices"]]
        aggothernonce = bytes.fromhex(test_case["aggothernonce"])
        tweaks = fromhex_all(test_case["tweaks"])
        is_xonly = test_case["is_xonly"]
        msg = msgs[test_case["msg_index"]]
        signer_index = test_case["signer_index"]
        rand = bytes.fromhex(test_case["rand"]) if test_case["rand"] is not None else None
        expected = fromhex_all(test_case["expected"])

        pubnonce, psig = deterministic_sign(sk, aggothernonce, pubkeys, tweaks, is_xonly, msg, rand)
        assert pubnonce == expected[0]
        assert psig == expected[1]

        pubnonces = [aggothernonce, pubnonce]
        aggnonce = nonce_agg(pubnonces)
        session_ctx = SessionContext(aggnonce, pubkeys, tweaks, is_xonly, msg)
        assert partial_sig_verify_internal(psig, pubnonce, pubkeys[signer_index], session_ctx)

    for test_case in error_test_cases:
        exception, except_fn = get_error_details(test_case)

        pubkeys = [X[i] for i in test_case["key_indices"]]
        aggothernonce = bytes.fromhex(test_case["aggothernonce"])
        tweaks = fromhex_all(test_case["tweaks"])
        is_xonly = test_case["is_xonly"]
        msg = msgs[test_case["msg_index"]]
        signer_index = test_case["signer_index"]
        rand = bytes.fromhex(test_case["rand"]) if test_case["rand"] is not None else None

        try_fn = lambda: deterministic_sign(sk, aggothernonce, pubkeys, tweaks, is_xonly, msg, rand)
        assert_raises(exception, try_fn, except_fn)

def test_sig_agg_vectors() -> None:
    with open(os.path.join(sys.path[0], 'vectors', 'sig_agg_vectors.json')) as f:
        test_data = json.load(f)

    X = fromhex_all(test_data["pubkeys"])

    # These nonces are only required if the tested API takes the individual
    # nonces and not the aggregate nonce.
    pnonce = fromhex_all(test_data["pnonces"])

    tweak = fromhex_all(test_data["tweaks"])
    psig = fromhex_all(test_data["psigs"])

    msg = bytes.fromhex(test_data["msg"])

    valid_test_cases = test_data["valid_test_cases"]
    error_test_cases = test_data["error_test_cases"]

    for test_case in valid_test_cases:
        pubnonces = [pnonce[i] for i in test_case["nonce_indices"]]
        aggnonce = bytes.fromhex(test_case["aggnonce"])
        assert aggnonce == nonce_agg(pubnonces)

        pubkeys = [X[i] for i in test_case["key_indices"]]
        tweaks = [tweak[i] for i in test_case["tweak_indices"]]
        is_xonly = test_case["is_xonly"]
        psigs = [psig[i] for i in test_case["psig_indices"]]
        expected = bytes.fromhex(test_case["expected"])

        session_ctx = SessionContext(aggnonce, pubkeys, tweaks, is_xonly, msg)
        sig = partial_sig_agg(psigs, session_ctx)
        assert sig == expected
        aggpk = get_xonly_pk(key_agg_and_tweak(pubkeys, tweaks, is_xonly))
        assert schnorr_verify(msg, aggpk, sig)

    for test_case in error_test_cases:
        exception, except_fn = get_error_details(test_case)

        pubnonces = [pnonce[i] for i in test_case["nonce_indices"]]
        aggnonce = nonce_agg(pubnonces)

        pubkeys = [X[i] for i in test_case["key_indices"]]
        tweaks = [tweak[i] for i in test_case["tweak_indices"]]
        is_xonly = test_case["is_xonly"]
        psigs = [psig[i] for i in test_case["psig_indices"]]

        session_ctx = SessionContext(aggnonce, pubkeys, tweaks, is_xonly, msg)
        assert_raises(exception, lambda: partial_sig_agg(psigs, session_ctx), except_fn)


def sign_and_verify_with_aggpk(
    aggpk: XonlyPk, 
    sk_1: bytes, 
    sk_2: bytes, 
    pk_1: PlainPk, 
    pk_2: PlainPk, 
    i: int, 
    random_nonce: bool, 
    tweaks: List[bytes], 
    is_xonly: List[bool]
) -> Tuple[XonlyPk, bytes]:
    pubkeys = [pk_1, pk_2]
    msg = secrets.token_bytes(32)
    # Use a non-repeating counter for extra_in
    secnonce_1, pubnonce_1 = nonce_gen(sk_1, pk_1, aggpk, msg, i.to_bytes(4, 'big'))

    # On even iterations use regular signing algorithm for signer 2,
    # otherwise use deterministic signing algorithm
    if random_nonce:
        # Use a clock for extra_in
        t = time.clock_gettime_ns(time.CLOCK_MONOTONIC)
        secnonce_2, pubnonce_2 = nonce_gen(sk_2, pk_2, aggpk, msg, t.to_bytes(8, 'big'))
    else:
        aggothernonce = nonce_agg([pubnonce_1])
        rand = secrets.token_bytes(32)
        pubnonce_2, psig_2 = deterministic_sign(sk_2, aggothernonce, pubkeys, tweaks, is_xonly, msg, rand)

    pubnonces = [pubnonce_1, pubnonce_2]
    aggnonce = nonce_agg(pubnonces)

    session_ctx = SessionContext(aggnonce, pubkeys, tweaks, is_xonly, msg)
    psig_1 = sign(secnonce_1, sk_1, session_ctx)
    assert partial_sig_verify(psig_1, pubnonces, pubkeys, tweaks, is_xonly, msg, 0)
    # An exception is thrown if secnonce_1 is accidentally reused
    assert_raises(ValueError, lambda: sign(secnonce_1, sk_1, session_ctx), lambda e: True)

    # Wrong signer index
    assert not partial_sig_verify(psig_1, pubnonces, pubkeys, tweaks, is_xonly, msg, 1)

    # Wrong message
    assert not partial_sig_verify(psig_1, pubnonces, pubkeys, tweaks, is_xonly, secrets.token_bytes(32), 0)

    if random_nonce:
        psig_2 = sign(secnonce_2, sk_2, session_ctx)
    assert partial_sig_verify(psig_2, pubnonces, pubkeys, tweaks, is_xonly, msg, 1)

    sig = partial_sig_agg([psig_1, psig_2], session_ctx)
    assert schnorr_verify(msg, aggpk, sig)


def sign_and_verify_with_keys(
    sk_1: bytes, 
    sk_2: bytes, 
    pk_1: PlainPk, 
    pk_2: PlainPk, 
    i: int, 
    random_nonce: bool,
) -> Tuple[XonlyPk, bytes]:
    # In this example, the message and aggregate pubkey are known before nonce generation,
    # before nonce generation, so they can be passed into the nonce
    # generation function as a defense-in-depth measure to protect
    # against nonce reuse.
    #
    # If these values are not known when nonce_gen is called, empty
    # byte arrays can be passed in for the corresponding arguments
    # instead.
    pubkeys = [pk_1, pk_2]
    v = secrets.randbelow(4)
    tweaks = [secrets.token_bytes(32) for _ in range(v)]
    is_xonly = [secrets.choice([False, True]) for _ in range(v)]
    aggpk = get_xonly_pk(key_agg_and_tweak(pubkeys, tweaks, is_xonly))
    sign_and_verify_with_aggpk(aggpk, sk_1, sk_2, pk_1, pk_2, i, random_nonce, tweaks, is_xonly)

def test_sign_and_verify_random(iters: int) -> None:
    for i in range(iters):
        sk_1 = secrets.token_bytes(32)
        sk_2 = secrets.token_bytes(32)
        pk_1 = individual_pk(sk_1)
        pk_2 = individual_pk(sk_2)
        sign_and_verify_with_keys(sk_1, sk_2, pk_1, pk_2, i, random_nonce=i % 2 != 0)


def sign_and_verify_with_aggpk_bitgo(
    aggpk: XonlyPk, 
    sk_1: bytes, 
    sk_2: bytes, 
    pk_1: PlainPk, 
    pk_2: PlainPk, 
    legacy_agg: bool = False
) -> None:
    sign_and_verify_with_aggpk(
        aggpk,
        sk_1,
         sk_2, 
         pk_1, 
         pk_2, 
         0, 
         random_nonce=False, 
         tweaks=[], 
         is_xonly=[])

def sign_and_verify_with_aggpk_bitgo_legacy(
    aggpk: XonlyPk, 
    sk_1: bytes, 
    sk_2: bytes, 
    pk_1: PlainPk, 
    pk_2: PlainPk,
) -> None:
    # normalize the secret key so that the pubkey is even
    def norm_sk(sk: bytes) -> bytes:
        pk = individual_pk(sk)
        P = cpoint(pk)
        if has_even_y(P):
            return sk
        else:
            # negate the secret key
            # For secp256k1, negating a secret key is (N - sk), where N is the curve order.
            norm_sk = ((n - int_from_bytes(sk)) % n).to_bytes(32, 'big')
            return norm_sk

    # normalize the secret keys so that the pubkeys are even
    sk_1 = norm_sk(sk_1)
    sk_2 = norm_sk(sk_2)
    pk_1 = individual_pk(sk_1)[-32:]
    pk_2 = individual_pk(sk_2)[-32:]

    # order sk_1 and sk_2 by pk order
    if pk_1 > pk_2:
        sk_1, sk_2 = sk_2, sk_1
        pk_1, pk_2 = pk_2, pk_1

    # recompute agg_pk
    expected_aggpk = get_xonly_pk(key_agg([pk_1, pk_2]))
    assert aggpk == expected_aggpk, \
        f"p2tr aggregation mismatch: expected {expected_aggpk.hex()}, got {aggpk.hex()}"
    
    sign_and_verify_with_aggpk(
        expected_aggpk,
        sk_1,
        sk_2,
        pk_1,
        pk_2,
        0,
        random_nonce=False,
        tweaks=[],
        is_xonly=[]
    )

# This tests the algorithms used by the bitgo 
# - legacy 'p2tr' output script type (chain 30, 31)
# - standard 'p2trMusig2' script type (chain 40, 41)

# Private keys from test fixtures
privkey_user = bytes.fromhex("a07e682489dad68834f7df8a5c8b34f3b9ff9fdd8809e2ba53ae29df65fc146b")
privkey_bitgo = bytes.fromhex("2d210ff6703d0fae0e9ca91e1d0bbab006b03e8e699f49becbaf554066fa79aa")

# Note that pubkeys here have different order depending on whether comparison is on the plain or x-only version
pubkey_user = PlainPk(bytes.fromhex("02d20a62701c54f6eb3abb9f964b0e29ff90ffa3b4e3fcb73e7c67d4950fa6e3c7"))
pubkey_bitgo = PlainPk(bytes.fromhex("03203ab799ce28e2cca044f594c69275050af4bb0854ad730a8f74622342300e64"))

def test_agg_bitgo_derive() -> None:
    # Verify that private keys derive to the expected public keys
    assert individual_pk(privkey_user) == pubkey_user, \
        f"User private key does not derive to expected public key: expected {pubkey_user.hex()}, got {individual_pk(privkey_user).hex()}"
    assert individual_pk(privkey_bitgo) == pubkey_bitgo, \
        f"BitGo private key does not derive to expected public key: expected {pubkey_bitgo.hex()}, got {individual_pk(privkey_bitgo).hex()}"

def test_agg_bitgo_p2tr_legacy() -> None:
    expected_internal_pubkey_p2tr = PlainPk(bytes.fromhex("cc899cac29f6243ef481be86f0d39e173c075cd57193d46332b1ec0b42c439aa"))

    # Aggregation using nonstandard key_agg_bitgo_p2tr_legacy
    keyagg_ctx = key_agg_bitgo_p2tr_legacy([pubkey_user, pubkey_bitgo])
    aggregated_xonly = get_xonly_pk(keyagg_ctx)
    assert aggregated_xonly == expected_internal_pubkey_p2tr, \
        f"p2tr aggregation mismatch: expected {expected_internal_pubkey_p2tr.hex()}, got {aggregated_xonly.hex()}"
    sign_and_verify_with_aggpk_bitgo(
        expected_internal_pubkey_p2tr, 
        privkey_bitgo, 
        privkey_user, 
        pubkey_bitgo, 
        pubkey_user, 
        legacy_agg=True,
    )

    # Aggregation with keys in reverse order yields same result
    keyagg_ctx = key_agg_bitgo_p2tr_legacy([pubkey_bitgo, pubkey_user])
    aggregated_xonly = get_xonly_pk(keyagg_ctx)
    assert aggregated_xonly == expected_internal_pubkey_p2tr, \
        f"p2tr aggregation mismatch: expected {expected_internal_pubkey_p2tr.hex()}, got {aggregated_xonly.hex()}"

def test_agg_bitgo_p2tr_musig2() -> None:
    expected_internal_pubkey_p2tr_musig2 = PlainPk(bytes.fromhex("c0e255b4510e041ab81151091d875687a618de314344dff4b73b1bcd366cdbd8"))
    expected_internal_pubkey_p2tr_musig2_reverse = PlainPk(bytes.fromhex("e48d309b535811eb0b148c4b0600a10e82e289899429e40aee05577504eca356"))


    # Aggregation using standard key_agg
    keyagg_ctx = key_agg([pubkey_user, pubkey_bitgo])
    aggregated_xonly = get_xonly_pk(keyagg_ctx)
    assert aggregated_xonly == expected_internal_pubkey_p2tr_musig2, \
        f"p2trMusig2 aggregation mismatch: expected {expected_internal_pubkey_p2tr_musig2.hex()}, got {aggregated_xonly.hex()}"

    sign_and_verify_with_aggpk(
        expected_internal_pubkey_p2tr_musig2, 
        privkey_user, 
        privkey_bitgo, 
        pubkey_user, 
        pubkey_bitgo, 
        0, 
        random_nonce=False, 
        tweaks=[], 
        is_xonly=[]
    )

    # Aggregation using standard key_agg in reverse order yields different key
    keyagg_ctx = key_agg([pubkey_bitgo, pubkey_user])
    aggregated_xonly = get_xonly_pk(keyagg_ctx)
    assert aggregated_xonly == expected_internal_pubkey_p2tr_musig2_reverse, \
        f"p2trMusig2 aggregation mismatch: expected {expected_internal_pubkey_p2tr_musig2_reverse.hex()}, got {aggregated_xonly.hex()}"

    sign_and_verify_with_aggpk_bitgo(
        expected_internal_pubkey_p2tr_musig2_reverse, 
        privkey_bitgo, 
        privkey_user, 
        pubkey_bitgo, 
        pubkey_user, 
    )


if __name__ == '__main__':
    test_key_sort_vectors()
    test_key_agg_vectors()
    test_nonce_gen_vectors()
    test_nonce_agg_vectors()
    test_sign_verify_vectors()
    test_tweak_vectors()
    test_det_sign_vectors()
    test_sig_agg_vectors()
    test_sign_and_verify_random(6)
    test_agg_bitgo_derive()
    test_agg_bitgo_p2tr_legacy()
    test_agg_bitgo_p2tr_musig2()
