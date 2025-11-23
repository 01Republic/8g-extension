import { createCookieSessionStorage } from "react-router";

type SessionData = {
  userId: string;
  orgId: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60, // 24시간으로 연장
      path: "/",
      sameSite: "lax",
      secrets: ["s3cret1"],
      secure: false,
    },
  });

export { getSession, commitSession, destroySession };
