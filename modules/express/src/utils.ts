export const isJsonString = (str: any): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};
