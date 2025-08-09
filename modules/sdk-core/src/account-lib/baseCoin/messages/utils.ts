/**
 * Validates a message against a set of whitelisted templates.
 * The templates can contain placeholders like {{variable}} which will be replaced with a wildcard in the regex.
 *
 * @param whitelistedMessageTemplates - An array of whitelisted message templates.
 * @param {string} messageRaw - The raw message to validate.
 * @returns {boolean} - Returns true if the message matches any of the whitelisted templates, false otherwise.
 */
export function isMessageWhitelisted(whitelistedMessageTemplates: string[], messageRaw: string): boolean {
  if (!whitelistedMessageTemplates || whitelistedMessageTemplates.length === 0) {
    return true;
  }
  return whitelistedMessageTemplates.some((template) => {
    const regex = new RegExp(`^${template}$`, 's'); // 's' flag to match newlines
    return regex.test(messageRaw);
  });
}
