import { atom, useSetAtom } from "jotai";
import { useGetUser } from "@/hooks/auth/use-user";

export const userAtom = atom<User | null>(null);

export const useAsyncUserAtom = atom(async (get) => {
  let user = get(userAtom);
  const getUser = useGetUser();

  if (!user) {
    user = await getUser() as User;
  }
  return user;
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
