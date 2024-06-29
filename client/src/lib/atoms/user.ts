import { atom, useSetAtom } from "jotai";

export const userAtom = atom<User | null>(null);

export const useAsyncUserAtom = atom(async (get) => {
  // Resolve a promise so that it will be async and the suspense will work
  // as well as wait for the user to be fetched before setting the user
  // to ensure the correct user is set
  return Promise.resolve(get(userAtom));
});

export const useSetUserAtom = () => {
  return useSetAtom(userAtom);
};

export const useClearUserAtom = () => {
  const setUser = useSetAtom(userAtom);

  return () => {
    setUser(null);
  };
};
