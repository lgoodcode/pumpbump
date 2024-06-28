import { setUser } from "@sentry/nextjs";

export const setSentryUser = (user: User | null) => {
  if (user) {
    setUser({
      id: user.id,
      username: user.user_metadata.username,
      email: user.user_metadata.email_verified ? user.email : undefined,
    });
  } else {
    setUser(null);
  }
};
