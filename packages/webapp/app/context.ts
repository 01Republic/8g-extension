import { createContext } from "react-router";

export type UserType = {
  id: number;
  name: string;
  phone: string;
  profileImgUrl: string;
  orgId: number;
};

export const userContext = createContext<UserType | null>(null);
