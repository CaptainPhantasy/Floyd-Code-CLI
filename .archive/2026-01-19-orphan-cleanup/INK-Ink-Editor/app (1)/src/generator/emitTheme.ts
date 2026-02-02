export function emitTheme(): string {
  return `
export const theme = {
  colors: {
    primary: 'magenta',
    secondary: 'cyan',
    accent: 'yellow',
    bg: 'black',
    text: 'white',
    dim: 'gray'
  },
  spacing: {
    padding: 1,
    gap: 1
  }
};
`;
}
