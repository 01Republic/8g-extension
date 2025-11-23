import { Raw } from "typeorm";

export function Regexp(regExp = /^$/) {
  const text = regExp.toString().replace(/^\//, "").replace(/\/$/, "");
  return Raw((alias) => `${alias} REGEXP '${text}'`);
}
