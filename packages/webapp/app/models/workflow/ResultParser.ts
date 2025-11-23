import jsonata from "jsonata";

export class ResultParser {
  /**
   * JSONata 표현식으로 결과 파싱
   */
  static async parse(rawResult: any, expression: string): Promise<any> {
    try {
      const compiledExpr = jsonata(expression);
      const result = await compiledExpr.evaluate(rawResult);

      return result;
    } catch (error: any) {
      console.error("JSONata parsing failed:", error);
      throw new Error(`파싱 실패: ${error.message}`);
    }
  }
}
