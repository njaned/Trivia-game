/**
 * ANSI colour helpers.
 *
 * Colour is enabled only for an interactive terminal and can be switched off
 * with the NO_COLOR environment variable (https://no-color.org). Tests pass
 * `color: false` so assertions see plain text.
 */
export function createTheme({ color } = {}) {
  const enabled =
    color ??
    (Boolean(process.stdout.isTTY) &&
      !process.env.NO_COLOR &&
      process.env.TERM !== 'dumb');

  const paint = (open, close) => (text) =>
    enabled ? `\u001b[${open}m${text}\u001b[${close}m` : String(text);

  return {
    enabled,
    bold: paint(1, 22),
    dim: paint(2, 22),
    red: paint(31, 39),
    green: paint(32, 39),
    yellow: paint(33, 39),
    cyan: paint(36, 39),
  };
}
