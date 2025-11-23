import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { createAgent } from "langchain";
import { z } from "zod";
import * as dotenv from "dotenv";

// 서버 사이드에서 환경 변수 로드
dotenv.config();

const RequestSchema = z.object({
  sourceData: z.any(),
  targetSchema: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const { sourceData, targetSchema } = RequestSchema.parse(body);

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set in environment variables");
      throw new Error("API key not configured");
    }

    const agent = createAgent({
      model: "gpt-4.1",
      systemPrompt:
        "You are a JSONata expert. Generate valid JSONata expressions for data transformation.",
      responseFormat: z.object({
        expression: z
          .string()
          .describe("The JSONata expression to transform the data"),
      }),
    });

    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: `Source data: ${JSON.stringify(sourceData, null, 2)}
          
Target schema: ${targetSchema}

Generate a JSONata expression to transform the source data to match the target schema.`,
        },
      ],
    });

    return data(
      {
        success: true,
        expression: result.structuredResponse.expression,
      },
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Failed to generate JSONata:", error);
    return data(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate JSONata expression",
      },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
