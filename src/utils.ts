export const removeParams = (url: string): string => {
  return url.split("?")[0];
};
