import {
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
} from "typeorm";
import { Regexp } from "./regexp";
import { type FindOptionsWhere } from "typeorm";

function evaluate(v: any) {
  if (typeof v !== "string") return v;

  const val = v.toLowerCase();
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null") return IsNull();
  return v;
}

interface ParseWhereOption {
  secure?: boolean;
}

function parseWhere<T>(
  value: any,
  opt: ParseWhereOption = {},
): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
  if (typeof value !== "object") return value;
  if (value instanceof Array) return value.flatMap((v) => parseWhere(v, opt));

  for (const [key, val] of Object.entries(value)) {
    value[key] = evaluate(val);
    if (val && typeof val === "object" && val["op"]) {
      const op = val["op"];
      const v = val["val"];
      if (op === "not") value[key] = Not(evaluate(v));
      if (op === "like") value[key] = Like(evaluate(v));
      if (op === "in") value[key] = In(evaluate(v) || []);
      if (op === "lt") value[key] = LessThan(evaluate(v));
      if (op === "lte") value[key] = LessThanOrEqual(evaluate(v));
      if (op === "mt") value[key] = MoreThan(evaluate(v));
      if (op === "mte") value[key] = MoreThanOrEqual(evaluate(v));
      if (!opt.secure) {
        if (op === "regexp") value[key] = Regexp(new RegExp(evaluate(v)));
      }
    }
  }
  return value;
}

function parseWhereOne<T>(
  value: any,
  option: ParseWhereOption = {},
): FindOptionsWhere<T> {
  const wheres = parseWhere<T>(value, option);
  return wheres instanceof Array ? wheres[0] : wheres;
}

export default {
  parseWhere,
  parseWhereOne,
};
