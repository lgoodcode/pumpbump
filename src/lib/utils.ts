import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatPath = (path: string): `/${string}` => {
  if (path === "" || path[0] !== "/") {
    return `/${path}`;
  } else {
    return path as `/${string}`;
  }
};
