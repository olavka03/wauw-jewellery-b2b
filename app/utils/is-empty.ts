export const isEmpty = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object' && value !== null) {
    return !Object.keys(value).length;
  }

  return !value;
};
