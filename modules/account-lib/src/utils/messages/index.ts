export const MIDNIGHT_TNC_HASH = '31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

/*
 * matches a message that starts with "STAR ", followed by a number,
 * then " to addr" or " to addr_test1", followed by a 50+ character alphanumeric address,
 * and ends with the midnight TnC hash
 */
const MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE = `STAR \\d+ to addr(?:1|_test1)[a-z0-9]{50,} ${MIDNIGHT_TNC_HASH}`;

/**
 * @file Utility functions for validating messages against whitelisted templates.
 * This is used to ensure that only specific message formats are accepted.
 */
const whitelistedMessageTemplates = [MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE];

/**
 * Validates a message against a set of whitelisted templates.
 * The templates can contain placeholders like {{variable}} which will be replaced with a wildcard in the regex.
 *
 * @param {string} messageRaw - The raw message to validate.
 * @returns {boolean} - Returns true if the message matches any of the whitelisted templates, false otherwise.
 */
export function validateAgainstMessageTemplates(messageRaw: string): boolean {
  return whitelistedMessageTemplates.some((template) => {
    const regex = new RegExp(`^${template}$`, 's'); // 's' flag to match newlines
    return regex.test(messageRaw);
  });
}
