export async function buildJSONataQuery(
  sourceData: any,
  targetSchema: string,
): Promise<string> {
  try {
    const response = await fetch("/api/generate-jsonata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceData,
        targetSchema,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to generate JSONata expression");
    }

    return data.expression;
  } catch (error) {
    console.error("Failed to generate JSONata query:", error);
    throw error;
  }
}
