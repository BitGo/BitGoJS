import * as assert from 'assert';
import { parseKeycardFromLines } from '../../src/parseKeycard';

describe('parseKeycardFromLines', function () {
  it('happy path – clean JSON in one line', function () {
    const encryptedJson =
      '{"iv":"abc123","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"xyz789","ct":"AAABBBCCC"}';
    const lines = [
      'A: Box A – User Key',
      'data: xpub661MyMwAqRbcF...',
      'B: Box B – Backup Key',
      'data: xpub661MyMwAqRbcG...',
      'C: Box C – BitGo Key',
      'data: xpub661MyMwAqRbcH...',
      'D: Box D – Encrypted Wallet Password',
      `data: ${encryptedJson}`,
    ];

    const entries = parseKeycardFromLines(lines);
    const sectionD = entries.find((e) => e.label.startsWith('D:'));
    assert.ok(sectionD, 'section D should be present');
    assert.strictEqual(sectionD.value, encryptedJson);
  });

  it('Part N on its own line – strips standalone label', function () {
    const part1 =
      '{"iv":"abc123","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"xyz789","ct":"AAABBB';
    const part2 = 'CCCDDDEEE"}';
    const lines = [
      'A: Box A – User Key',
      'data: xpub661MyMwAqRbcF...',
      'B: Box B – Backup Key',
      'data: xpub661MyMwAqRbcG...',
      'C: Box C – BitGo Key',
      'data: xpub661MyMwAqRbcH...',
      'D: Box D – Encrypted Wallet Password',
      `data: ${part1}`,
      'Part 2',
      part2,
    ];

    const entries = parseKeycardFromLines(lines);
    const sectionD = entries.find((e) => e.label.startsWith('D:'));
    assert.ok(sectionD, 'section D should be present');
    assert.strictEqual(sectionD.value, `${part1}${part2}`);
  });

  it('multiple embedded Part N labels – strips all page-break labels across a long ct value', function () {
    const seg1 = 'AAABBBCCC';
    const seg2 = 'DDDEEEFFF';
    const seg3 = 'GGGHHH';
    const mergedLine = `{"iv":"abc123","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"xyz789","ct":"${seg1}Part 2 ${seg2}Part 3 ${seg3}"}`;
    const lines = [
      'A: Box A – User Key',
      'data: xpub661MyMwAqRbcF...',
      'D: Box D – Encrypted Wallet Password',
      `data: ${mergedLine}`,
    ];

    const entries = parseKeycardFromLines(lines);
    const sectionD = entries.find((e) => e.label.startsWith('D:'));
    assert.ok(sectionD, 'section D should be present');
    const expected = `{"iv":"abc123","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"xyz789","ct":"${seg1}${seg2}${seg3}"}`;
    assert.strictEqual(sectionD.value, expected);
  });

  it('Part N embedded mid-line – strips label fused into base64 content', function () {
    const ctPrefix = 'AAABBBCCC';
    const ctSuffix = 'DDDEEEFFF';
    const mergedLine = `{"iv":"abc123","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"xyz789","ct":"${ctPrefix}Part 2 ${ctSuffix}"}`;
    const lines = [
      'A: Box A – User Key',
      'data: xpub661MyMwAqRbcF...',
      'B: Box B – Backup Key',
      'data: xpub661MyMwAqRbcG...',
      'C: Box C – BitGo Key',
      'data: xpub661MyMwAqRbcH...',
      'D: Box D – Encrypted Wallet Password',
      `data: ${mergedLine}`,
    ];

    const entries = parseKeycardFromLines(lines);
    const sectionD = entries.find((e) => e.label.startsWith('D:'));
    assert.ok(sectionD, 'section D should be present');
    const expected = `{"iv":"abc123","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"xyz789","ct":"${ctPrefix}${ctSuffix}"}`;
    assert.strictEqual(sectionD.value, expected);
  });
});
