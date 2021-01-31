export const removeParams = (url: string): string => {
  return url.split("?")[0].split(".com/")[1];
};
