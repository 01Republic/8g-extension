/* eslint-disable @typescript-eslint/ban-ts-comment */

import { PaginationDto } from "./PaginationDto";
import { IsOptional, IsString } from "class-validator";
import {
  Between,
  FindOperator,
  In,
  type FindOptionsOrder,
  type FindOptionsWhere,
} from "typeorm";
import { Transform } from "class-transformer";
import helper from "./helper/findAll.query.helper";

export class FindAllQueryDto<T> extends PaginationDto {
  /**
   * Swagger 에서 명세하지 않고 있으나,
   * Product 리포지토리의 findAndCount 에서 동작하는 where 구문을
   * client 에서 자유롭게 자유롭게 구성할 수 있습니다.
   *
   * advanced operator 구성은 parseOperator 함수를 참고하세요.
   *
   * @example
   *
   *  #1) 숨김 처리되지 않은 도서 상품 조회
   *  /products?where[type]=BOOK&where[isDisplayHidden]=false
   *
   *    where[type]=BOOK
   *    where[isDisplayHidden]=false
   *
   *  #2) 신규 도서상품 중 도서명이 '린 스타트업 바이블'인 것을 검색
   *  /products?where[name]=린 스타트업 바이블&where[type]=BOOK&where[isNew]=true
   *
   *    where[type]=BOOK
   *    where[isNew]=true
   *    where[name]=린 스타트업 바이블
   */
  @IsOptional()
  @Transform(({ value }) => {
    return helper.parseWhereOne(value, { secure: true });
  })
  where: FindOptionsWhere<T> = {};

  /**
   * Swagger 에서 명세하지 않고 있으나,
   * Product 리포지토리의 findAndCount 에서 동작하는 order 구문을
   * client 에서 자유롭게 자유롭게 구성할 수 있습니다.
   *
   * @example
   *
   *  #1) 상품 전체를 등록일 기준 최신순 정렬
   *  * 참고로 최신순정렬은 id:desc 가 가장 응답이 빠릅니다.
   *  /products?order[createdAt]=DESC
   *
   *    order[createdAt]=DESC
   *
   *  #2) 도서상품을 판매상태별로 정렬 후, 결과 내에서 도서명 오름차순 정렬
   *  /products?where[type]=BOOK&order[createdAt]=DESC&order[name]=ASC
   *
   *    where[type]=BOOK
   *    order[status]=ASC
   *    order[name]=ASC
   *
   *  #3) 일반상품을 업체별로 정렬 후, 결과 내에서 상품의 등록일 최신순으로 재정렬
   *  /products?where[type]=GENERAL&order[companyId]=ASC&order[createdAt]=DESC
   *
   *    where[type]=GENERAL
   *    order[companyId]=ASC
   *    order[createdAt]=DESC
   */
  @IsOptional()
  order: FindOptionsOrder<T> = {};

  @IsOptional()
  relations: string[] = [];

  @IsOptional()
  updateCounterCacheColumn?: keyof T;
}

export class FindAllQueryDtoWithKeyword<T> extends FindAllQueryDto<T> {
  @IsString()
  @IsOptional()
  keyword?: string;
}

export class FindAllQueryDtoWithRegexp<T> extends FindAllQueryDto<T> {
  @IsOptional()
  @Transform(({ value }) => {
    return helper.parseWhereOne(value);
  })
  where: FindOptionsWhere<T> = {};
}

/**
 * Advanced Operator Object
 *
 * 1. In: 특정 필드에 대해 or 조건을 적용할 수 있습니다.
 * 2. Between: 특정 필드에 대해 범위조건으로 검색할 수 있습니다.
 *
 * @example
 *
 *    async findAll(query: FindAllQuery<User>) {
 *      const { page, itemsPerPage, where, order } = query;
 *
 *      // Operator 를 파싱 하고자 하는 컬럼을 다음과 같이 한 번 감싸줍니다.
 *      where.createdAt = parseOperator(where.createdAt);
 *
 *      const users = await this.repository.find({ where })
 *    }
 *
 * @example
 *
 *  #1) In
 *  * id 가 1 또는 2 또는 3 인 사용자를 검색
 *  /users?where[id][]=1&where[id][]=2&where[id][]=3
 *
 *    where[id][]=1
 *    where[id][]=2
 *    where[id][]=3
 *
 *    파싱된 Query 형태
 *    => { where: { id: [1, 2, 3] } }
 *
 *  #2) Between
 *  * 2022년 04월에 가입한 사용자를 검색
 *  /users?where[createdAt][from]=2022-04-01&where[createdAt][to]=2022-05-01
 *
 *    where[createdAt][from]=2022-04-01
 *    where[createdAt][to]=2022-05-01
 *
 *    파싱된 Query 형태
 *    => { where: { createdAt: { from: "2022-04-01", to: "2022-05-01" } } }
 */
export const parseOperator = <T = string>(value: T): FindOperator<T> | T => {
  if (typeof value === "string") {
    value = resolveJson(value);
  }

  switch (true) {
    case value instanceof Array:
      return In(value as any);
    case typeof value === "object":
      return parseObjectValue(value as any);
    default:
      // 주어진 값이 만약 정의되지 않은 Operator 이거나,
      // Operator 가 아닌 원시자료 값이더라도
      // 안전하게 방어하기 위해 그대로 반환합니다.
      return value;
  }
};

function resolveJson(value?: string) {
  if (!value) return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

interface ObjectValue {
  from?: string;
  to?: string;
}

function parseObjectValue(obj: ObjectValue): any {
  if (obj.from && obj.to) {
    return Between(obj.from, obj.to);
  }
}

type PrimitiveTypeOf<V> = V | "NULL";

type FindOptionsWherePlainValue<V> = V extends object
  ? FindOptionsWhere<V>
  : PrimitiveTypeOf<V>;

type FindOptionsWhereOperateObj<V> = {
  op: "not";
  val: FindOptionsWherePlainValue<V>;
};

// (V | 'NULL') | { op: 'not', val: (V | 'NULL') }
export type FindOptionsWhereValue<T> =
  | FindOptionsWherePlainValue<T>
  | FindOptionsWhereOperateObj<T>;

// export type FindOptionsWhere<T> = {
//   [P in keyof T]?: FindOptionsWhereValue<T[P]>;
// };
