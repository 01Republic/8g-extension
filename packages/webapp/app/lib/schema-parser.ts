import { z } from "zod";

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "array"
  | "object"
  | "record"
  | "literal"
  | "union";

export interface ParsedField {
  name: string;
  type: FieldType;
  optional: boolean;
  defaultValue?: any;
  description?: string;
  // For enum/literal types
  enumValues?: string[];
  // For array types
  arrayItemType?: FieldType;
  // For union types
  unionTypes?: FieldType[];
  // For nested object types
  nestedFields?: ParsedField[];
}

export interface ParsedSchema {
  fields: ParsedField[];
  blockName?: string;
}

/**
 * Zod schema를 파싱해서 필드 정보 추출
 */
export function parseZodSchema(schema: any): ParsedSchema {
  const fields: ParsedField[] = [];

  // Handle ZodIntersection (A & B)
  if (schema._def?.typeName === "ZodIntersection") {
    const leftFields = parseZodSchema(schema._def.left).fields;
    const rightFields = parseZodSchema(schema._def.right).fields;
    return { fields: [...leftFields, ...rightFields] };
  }

  // Use _def.typeName instead of instanceof to avoid version conflicts
  if (schema._def?.typeName !== "ZodObject") {
    return { fields };
  }

  // Get shape - it might be a function or an object
  const shape =
    typeof schema.shape === "function" ? schema.shape() : schema.shape;

  if (!shape || typeof shape !== "object") {
    return { fields };
  }

  for (const [fieldName, fieldSchema] of Object.entries(shape)) {
    const parsed = parseField(fieldName, fieldSchema as any);
    if (parsed) {
      fields.push(parsed);
    }
  }

  return { fields };
}

/**
 * Zod schema에서 필드 정보 추출
 */
function parseField(name: string, schema: any): ParsedField | null {
  // 1. Wrapper 벗기기
  const { unwrapped, optional, defaultValue } = unwrapZodSchema(schema);

  // 2. 타입 결정
  const typeInfo = determineFieldType(unwrapped);

  // 3. 필드 객체 조합
  const field: ParsedField = {
    name,
    optional,
    defaultValue: defaultValue ?? typeInfo.defaultValue,
    ...typeInfo,
  };

  // 4. Description 추가
  if ((unwrapped as any)._def?.description) {
    field.description = (unwrapped as any)._def.description;
  }

  return field;
}

/**
 * Zod schema에서 optional/default/nullable wrapper를 벗겨내기
 */
function unwrapZodSchema(schema: any): {
  unwrapped: any;
  optional: boolean;
  defaultValue?: any;
} {
  let currentSchema = schema;
  let state = { optional: false, defaultValue: undefined };

  while (true) {
    const handler = unwrapHandlers.find((h) => h.check(currentSchema));

    if (!handler) break;

    const result = handler.unwrap(currentSchema, state);
    currentSchema = result.schema;
    state = {
      optional: result.optional,
      defaultValue: result.defaultValue,
    };
  }

  return {
    unwrapped: currentSchema,
    optional: state.optional,
    defaultValue: state.defaultValue,
  };
}

/**
 * Wrapper 타입별 언래핑 핸들러
 */
type UnwrapHandler = {
  check: (schema: any) => boolean;
  unwrap: (
    schema: any,
    state: { optional: boolean; defaultValue?: any },
  ) => {
    schema: any;
    optional: boolean;
    defaultValue?: any;
  };
};

const unwrapHandlers: UnwrapHandler[] = [
  {
    check: (s) => s?._def?.typeName === "ZodOptional",
    unwrap: (s, state) => ({
      schema: s._def.innerType,
      optional: true,
      defaultValue: state.defaultValue,
    }),
  },
  {
    check: (s) => s?._def?.typeName === "ZodDefault",
    unwrap: (s, state) => ({
      schema: s._def.innerType,
      optional: state.optional,
      defaultValue:
        typeof s._def.defaultValue === "function"
          ? s._def.defaultValue()
          : s._def.defaultValue,
    }),
  },
  {
    check: (s) => s?._def?.typeName === "ZodNullable",
    unwrap: (s, state) => ({
      schema: s._def.innerType,
      optional: true,
      defaultValue: state.defaultValue,
    }),
  },
  {
    check: (s) => s?._def?.typeName === "ZodEffects",
    unwrap: (s, state) => ({
      schema: s._def.schema,
      optional: state.optional,
      defaultValue: state.defaultValue,
    }),
  },
];

/**
 * Zod schema의 타입을 결정하고 추가 정보 추출
 */
function determineFieldType(
  schema: any,
): Pick<
  ParsedField,
  | "type"
  | "enumValues"
  | "arrayItemType"
  | "unionTypes"
  | "defaultValue"
  | "nestedFields"
> {
  const handler = typeHandlers.find((h) => h.check(schema));
  return handler ? handler.handle(schema) : { type: "string" }; // default
}

/**
 * 타입별 핸들러 정의
 */
type TypeHandler = {
  check: (schema: any) => boolean;
  handle: (
    schema: any,
  ) => Pick<
    ParsedField,
    | "type"
    | "enumValues"
    | "arrayItemType"
    | "unionTypes"
    | "defaultValue"
    | "nestedFields"
  >;
};

const typeHandlers: TypeHandler[] = [
  {
    check: (s) => s?._def?.typeName === "ZodString",
    handle: () => ({ type: "string" }),
  },
  {
    check: (s) => s?._def?.typeName === "ZodNumber",
    handle: () => ({ type: "number" }),
  },
  {
    check: (s) => s?._def?.typeName === "ZodBoolean",
    handle: () => ({ type: "boolean" }),
  },
  {
    check: (s) => s?._def?.typeName === "ZodEnum",
    handle: (s) => ({
      type: "enum",
      enumValues:
        s.options || s._def?.values || Object.values(s._def?.entries || {}),
    }),
  },
  {
    check: (s) => s?._def?.typeName === "ZodLiteral",
    handle: (s) => ({
      type: "literal",
      defaultValue: s._def.value,
    }),
  },
  {
    check: (s) => s?._def?.typeName === "ZodArray",
    handle: (s) => {
      const itemType = s._def?.type || s._def?.element || s.element;
      return {
        type: "array",
        arrayItemType:
          itemType?._def?.typeName === "ZodString"
            ? "string"
            : itemType?._def?.typeName === "ZodNumber"
              ? "number"
              : undefined,
      };
    },
  },
  {
    check: (s) => s?._def?.typeName === "ZodRecord",
    handle: () => ({ type: "record" }),
  },
  {
    check: (s) => s?._def?.typeName === "ZodObject",
    handle: (s) => {
      // Parse nested object fields
      const nestedFields: ParsedField[] = [];
      const shape = s.shape;

      for (const [fieldName, fieldSchema] of Object.entries(shape || {})) {
        const parsed = parseField(fieldName, fieldSchema as any);
        if (parsed) {
          nestedFields.push(parsed);
        }
      }

      return { type: "object", nestedFields };
    },
  },
  {
    check: (s) => s._def?.typeName === "ZodUnion",
    handle: (s) => ({
      type: "union",
      unionTypes: (s._def?.options || []).map((opt: any) => {
        if (opt?._def?.typeName === "ZodString") return "string";
        if (opt?._def?.typeName === "ZodArray") return "array";
        if (opt?._def?.typeName === "ZodNumber") return "number";
        if (opt?._def?.typeName === "ZodBoolean") return "boolean";
        if (opt?._def?.typeName === "ZodObject") return "object";
        return "string";
      }),
    }),
  },
  {
    check: (s) => s._def?.typeName === "ZodDiscriminatedUnion",
    handle: (s) => {
      // Handle discriminated unions like schemaDefinition
      const options = s._def?.options || [];
      const unionTypes = options.map((opt: any) => {
        if (opt?._def?.typeName === "ZodObject") return "object";
        return "string";
      });
      return { type: "union", unionTypes };
    },
  },
  {
    check: (s) => s._def?.typeName === "ZodAny",
    handle: () => ({ type: "string" }), // Treat ZodAny as string for UI purposes
  },
];
