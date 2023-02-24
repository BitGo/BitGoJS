// Copyright (c) 2018, Ben Noordhuis <info@bnoordhuis.nl>
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

'use strict'

module.exports.random = random
module.exports.isBigIntPrime = isPrime

const {randomBytes} = require('crypto')

function random(bits, cb) {
	if (bits < 0)
		throw new RangeError('bits < 0')

	const n = (bits >>> 3) + !!(bits & 7) // Round up to next byte.
	const r = 8*n - bits
	const s = 8 - r
	const m = (1 << s) - 1 // Bits to mask off from MSB.

	if (cb)
		return randomcb(n, m, cb)

	const bytes = randomBytes(n)

	maskbits(m, bytes)

	return bytes2bigint(bytes)
}

function randomcb(n, m, cb) {
	randomBytes(n, (err, bytes) => {
		if (err)
			return cb(err)

		maskbits(m, bytes)

		cb(null, bytes2bigint(bytes))
	})
}

// Note: mutates the contents of |bytes|.
function maskbits(m, bytes) {
	// Mask off bits from the MSB that are > log2(bits).
	// |bytes| is treated as a big-endian bigint so byte 0 is the MSB.
	if (bytes.length > 0)
		bytes[0] &= m
}

function bytes2bigint(bytes) {
	let result = 0n

	const n = bytes.length

	// Read input in 8 byte slices. This is, on average and at the time
	// of writing, about 35x faster for large inputs than processing them
	// one byte at a time.
	if (n >= 8) {
		const view = new DataView(bytes.buffer, bytes.byteOffset)

		for (let i = 0, k = n & ~7; i < k; i += 8) {
			const x = view.getBigUint64(i, false)
			result = (result << 64n) + x
		}
	}

	// Now mop up any remaining bytes.
	for (let i = n & ~7; i < n; i++)
		result = result * 256n + BigInt(bytes[i])

	return result
}


// Javascript program Miller-Rabin primality test
// based on JavaScript code found at https://www.geeksforgeeks.org/primality-test-set-3-miller-rabin/

// Utility function to do
// modular exponentiation.
// It returns (x^y) % p
function power(x, y, p)
{
	
	// Initialize result 
    // (JML- all literal integers converted to use n suffix denoting BigInt)
	let res = 1n;
	
	// Update x if it is more than or
	// equal to p
	x = x % p;
	while (y > 0n)
	{
		
		// If y is odd, multiply
		// x with result
		if (y & 1n)
			res = (res*x) % p;

		// y must be even now
		y = y/2n; // (JML- original code used a shift operator, but division is clearer)
		x = (x*x) % p;
	}
	return res;
}


// This function is called
// for all k trials. It returns
// false if n is composite and
// returns false if n is
// probably prime. d is an odd
// number such that d*2<sup>r</sup> = n-1
// for some r >= 1
function miillerTest(d, n)
{
    // (JML- all literal integers converted to use n suffix denoting BigInt)
	
	// Pick a random number in [2..n-2]
	// Corner cases make sure that n > 4
    /* 
        JML- I can't mix the Number returned by Math.random with
        operations involving BigInt. The workaround is to create a random integer 
        with precision 6 and convert it to a BigInt.
    */  
    const r = BigInt(Math.floor(Math.random() * 100_000))
    // JML- now I have to divide by the multiplier used above (BigInt version)
    const y = r*(n-2n)/100_000n
	let a = 2n + y % (n - 4n);

	// Compute a^d % n
	let x = power(a, d, n);

	if (x == 1n || x == n-1n)
		return true;

	// Keep squaring x while one
	// of the following doesn't
	// happen
	// (i) d does not reach n-1
	// (ii) (x^2) % n is not 1
	// (iii) (x^2) % n is not n-1
	while (d != n-1n)
	{
		x = (x * x) % n;
		d *= 2n;

		if (x == 1n)	
			return false;
		if (x == n-1n)
			return true;
	}

	// Return composite
	return false;
}

// It returns false if n is
// composite and returns true if n
// is probably prime. k is an
// input parameter that determines
// accuracy level. Higher value of
// k indicates more accuracy.
function isPrime( n, k=40)
{
	// (JML- all literal integers converted to use n suffix denoting BigInt)
	// Corner cases
	if (n <= 1n || n == 4n) return false;
	if (n <= 3n) return true;

	// Find r such that n =
	// 2^d * r + 1 for some r >= 1
	let d = n - 1n;
	while (d % 2n == 0n)
		d /= 2n;

	// Iterate given nber of 'k' times
	for (let i = 0; i < k; i++)
		if (!miillerTest(d, n))
			return false;

	return true;
}