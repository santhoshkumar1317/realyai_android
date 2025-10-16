export const colors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  primary: '#6a0dad',
  white: '#ffffff',
  text: '#333333',
  error: '#f44336',
};

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
};

export const spacing = {
  md: 16,
  lg: 24,
};

export const borderRadius = {
  md: 8,
  lg: 12,
};