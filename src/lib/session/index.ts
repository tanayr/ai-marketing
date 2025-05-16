import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
export const SESSION_KEY = "gloow-session";

export interface SessionValue {
  initialRef?: string;
  currentOrganizationId?: string;
}

export const getSession = async () => {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionValue>(cookieStore, {
    password: (process.env.SESSION_SECRET || process.env.AUTH_SECRET) as string,
    cookieName: SESSION_KEY,
  });

  return session;
};

export const setSession = async (newValues: Partial<SessionValue>) => {
  const session = await getSession();
  // get keys of newValues
  const keys = Object.keys(newValues) as (keyof SessionValue)[];
  // set keys of session to newValues
  keys.forEach((key) => {
    session[key] = newValues[key] as SessionValue[typeof key];
  });
  await session.save();
  return session;
};
