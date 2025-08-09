/**
 * Validates a message against a set of whitelisted templates.
 * The templates can contain placeholders like {{variable}} which will be replaced with a wildcard in the regex.
 *
 * @param whitelistedMessageTemplates - A record of whitelisted message templates.
 * @param {string} messageRaw - The raw message to validate.
 * @returns {boolean} - Returns true if the message matches any of the whitelisted templates, false otherwise.
 */
export function isMessageWhitelisted(whitelistedMessageTemplates: Record<string, string>, messageRaw: string): boolean {
  if (!whitelistedMessageTemplates || !Object.keys(whitelistedMessageTemplates).length) {
    return true;
  }
  return Object.values(whitelistedMessageTemplates).some((template) => {
    const regex = new RegExp(`^${template}$`, 's'); // 's' flag to match newlines
    return regex.test(messageRaw);
  });
}
