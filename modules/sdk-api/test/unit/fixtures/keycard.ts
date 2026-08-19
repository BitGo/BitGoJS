/**
 * Fixtures for real-world v1 decrypt parity tests.
 *
 * These come from a purpose-built BitGo test keycard (wallet name: "sol")
 * created 2026-08-14 solely for this test suite. The wallet is a throwaway
 * testnet Solana wallet with no real funds; the ciphertexts, wallet, and
 * password below are safe to check in.
 *
 * Boxes A + B are the user and backup MPC key shares (uShare), encrypted
 * client-side with the wallet password using the exact envelope shape BitGo
 * produces in production (`iter=10000, ks=256, ts=64, mode=ccm, cipher=aes,
 * adata=""`).
 *
 * Purpose: catch any regression where the native/shim decrypt paths diverge
 * from SJCL on real production-shaped envelopes.
 */

export const KEYCARD_PASSWORD = '97IoV9Qs3fuhBKYCg6ju0y6LPBHTywBY';

export const KEYCARD_BOX_A =
  '{"iv":"iury+nZhVfoWjpzbzrN1Yw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"WiUMqHlpxiQ=","ct":"Qx6nr/Q+oEaHmmsIq75cHcR4hR4XzowpJvdgNuzcGD6v113dimT8tg2FAWAGj+syRfH19X5cDBhFX6k3ifWMbyQHneHs0OGh86kjm/v4ddNHaGgGEzhsQCWX2tAOyhxT+oG5PewnSr+xFGZePvo0GFakmPFLzF9gfvG8K3o30i0iU5UyzPdp5iAZGbZTseqp6d3KXcleA712Gnv5eT0mlDYJwoi9Io7TwCjdaa2M5r1PFkN8ZaC1aIzba3A+f7b7PDrfFckGGDIl6o2ytjNEpCKvvbfiTbk9/WOIXtMibW1e3ysmuPl5tiw2lSAtYXHQOl9rqwEvtoIMtM2uZqAE+ELf8UiabdBpdCYFiSVBgD+jjEfgUocd7xCRh2bW/Uqhu8ye7SDdZowMaTI3d/sGW8QubquPaHWQZTkhvDXttT0l1YXsIld3L2mQfDw+FpFD+SihNDiCf4fVYHFI/I9bYMx03QnUV+wXyo0dl1QXnkyVxTVOeaoJ7dM7Tp7h5cY2m5Dlp2YvAY2twRzOSPKjYu8M+rUuY0GsbodZW8mKXCLVfTyNmonSgqmLZ7V8MlZ4oR2gGfPn39XrGG9fRPj3lKb4gaFCSweHWfXAAXLN+MP9BquE57cphKn8RcuwwGPnH0j/tKOdcqKtn1XcAKtf8+s3L7utIXS+dijADqTLrjfG/2gKe4NbpykiW/vOPQ+2BbZO7d0F0YMnd2di/KD2VL5Y3M6Iib1zZAQX1r41X9Zb1/ShEsKtFyObi2zG0atYrQ6g4+f11nBbwJa6BD6n3P+UAaHvIJoXEFnaccvq3OWowlHQppQUOqCkdg5kwf2fXJqkR9hGGSBpXM48gm61hgwR12n2rDQxks6wwtdtm5BMKZrJy25x/ZAqYaQejm+0dT9SVa0qpNNOa1IdDzrPnI0AL1aLNGOVQ9EwEt9OOYoS/DBTp7JmVwhShDC5w8Br3KOKsm5qlWz/uslhfWBR7l6+BFft2jjfeCmfjZORCuhV5tX5nnQXuc13HjQkrdzaJE+LXZYtal+U83i2SfdwZnWuplTQqxKk+C0ikfGGJd7PDNb+8VEoR3rEIXk4YKJyI/HyPAVwNJN48tm/364SOm/iPV+wW5HvwPDmRJBan5vs66pTT2GtkZsZD1L+BxN4s8ycM4BWO1xyjgTI7mKjSatSnBqeJ0Cm0bIHq8hsbM9lH8yc0VsJ"}';

export const KEYCARD_BOX_B =
  '{"iv":"QZw8ZmHqaBqQh6X6PSCcMg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"yM+BoSyVwaY=","ct":"oPtcvWYf287IRi9To/UobTLrm5m+YCs6Tp1CuYvPJ5oazTcbmzZkS+gn2hxAGCvojGGV61qieEgrKEKDdKLE4/jSWUhY/VXyFE6BRb2uB5pFny8NwSsVb5Gw5R38bgs0XZ0aL4RCEQgByIkWGKJn3ZbpfmzFcD+x226WZkL0gS1DN5RK8bwAfgrabVp6MupLa/NN7M/YiH9aO9PELdvu/mbyC0zdAwwY8MHpMdf5IPOJi3ieMorUtEsuzfP4SBI2EAHdFi3/VmzIKG69sZS1uIULHB5Xya5ury7+qp6nihlxJOB4S8zpri/rXow+0EQL2bKUSkQz6r6GTL5MclyfkxVcCptVMPrCcsDdVc9P0sR36iP/AsdCTJGuHbzv0AERs776+cUyqivlQj1CQ3GkIHNQKyYjktKLx1PmEMTo29hEEbKVavM8ZoxTbjL/uIaxpz9Di1zh3RB8f1HXmq2JD2XEAPAky+Ukh8FSavROG64GRkPJY4AtUxXvvzUc2M9QCy6wbDIC8prJEio5jWyKZSZ4KVpMSEK98/htMjgB8hH07CdfiJnvMVy7xe9hHOtl3zThMP6r+9g8WpGdT02Y2kWWOVZlhBaPohuiCiJLHOigiN86Tt7i5kgSTB6w8zT4tcZWzSeOBh68eAupDt0qOdfadNESQICJ3fAgfQfeR7pPzjt54npB7c9KpLnJgDhrl4LpwicwZwuYKv0gJ7t9KKKTLFHRp5RD5Nr+8tk10aIxDQxLWCVSwalie5HhTzPsF8OUqNrJJ9mSBGtsTh/Saf5osvE/ETYdU7PTJpVHDYCS5/DaCrV7acZn1ZBzCD9P9FzttzF8RlwPOideEsYDWLORvwdmNHYgTavNnOY4UnISgA07UtFsgzgJ4gC4ubCE32C5MNkX4hGIi/15O4Y0ZaiAeOu2Qnm9r6zfdYZP4TCeQAZEGKy5DsO+VYOLImvhRZD8aOoFvxmQJWM5MEMozEImms8cwJuDRP60WhZqUCgemmmyHHDRPG3+EmUGU2W4QWDQt7G6uADcDCFsYojyshg0+6QRMdc5pLR3wUa4MRug7t49kit0Q/yFMn8kHn6/jhokRdIHt8Yvo1/wnGmw7aGvKX3rtUKOpqZ4AkOakhKuqRJyJvh3nsfz6BXtjx0UnW80Dt8WgAol+x0IFLcbcnwjICotU9uupfn+ONGK0C4NUSiJVg=="}';

/** Prefix of the decrypted plaintext for structural sanity checking. Both boxes are MPC uShare JSON. */
export const KEYCARD_PLAINTEXT_PREFIX = '{"uShare":{"i":';

/** Expected plaintext lengths, verified against sjcl.decrypt during test authoring. */
export const KEYCARD_BOX_A_LENGTH = 895;
export const KEYCARD_BOX_B_LENGTH = 893;
