import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const fallbackApiKey = process.env.GROQ_API_KEY_FALLBACK;
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    if (!apiKey && !fallbackApiKey) {
      return NextResponse.json(
        { success: false, error: "Groq API key not configured on server." },
        { status: 500 }
      );
    }

    const { prompt, workspaceId, userName, userEmail } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, error: "A valid prompt description is required." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are ANSH Copilot, a business AI assistant specializing in project management for MSME (Micro, Small, and Medium Enterprises) teams in India.

Your task is to generate a complete project setup based on the user's description. The project should be appropriate for MSME business contexts like retail, HR, finance, marketing, operations, etc.

Respond ONLY with a valid JSON object matching this schema:
{
  "name": "String (concise project name, max 6 words)",
  "description": "String (clear project description explaining the objective, max 40 words)",
  "category": "String (must be one of: 'Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance', 'Product', 'Support', 'Research')",
  "status": "String (must be one of: 'Discovery', 'Planning', 'Active', 'Review', 'Completed', 'On Hold')",
  "priority": "String (must be one of: 'Urgent', 'High', 'Normal', 'Low')",
  "health": "String (must be one of: 'good', 'warn', 'danger', 'neutral')",
  "estimatedHours": Number (realistic estimated hours for the project, e.g. 40, 80, 120, 200)
}

Choose appropriate values based on the business context described. For MSME businesses:
- Retail/Shop projects → Operations or Sales category
- HR/Recruitment → HR category
- Social media/campaigns → Marketing category
- GST/Finance/Accounts → Finance category
- Website/App → Engineering or Product category
- Customer service → Support category

Do not include markdown wrappers, triple backticks, or extra commentary. Output only raw JSON.`;

    const requestBody = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    };

    let groqResponse: Response | undefined;

    try {
      if (apiKey) {
        groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
      }

      if ((!groqResponse || !groqResponse.ok) && fallbackApiKey) {
        if (groqResponse) {
          console.warn(`Primary key failed (${groqResponse.status}). Trying fallback...`);
        }
        groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${fallbackApiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
      }
    } catch (err) {
      console.error("Exception during primary Groq request:", err);
      if (fallbackApiKey) {
        groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${fallbackApiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        throw err;
      }
    }

    if (!groqResponse || !groqResponse.ok) {
      const errStatus = groqResponse ? groqResponse.status : "unknown";
      const errText = groqResponse ? await groqResponse.text() : "No response";
      console.error(`Groq API error ${errStatus}:`, errText);
      return NextResponse.json(
        { success: false, error: "Failed to communicate with Groq AI API." },
        { status: 502 }
      );
    }

    const data = await groqResponse.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      return NextResponse.json(
        { success: false, error: "No response returned from Groq AI API." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(resultText);

    // Save AI usage log
    if (parsed?.name) {
      await prisma.aiUsageLog.create({
        data: {
          userName: userName || "Unknown User",
          userEmail: userEmail || "unknown@domain.com",
          action: "AI Project Draft",
          creditConsumed: 2,
          workspaceId: Number(workspaceId || 1),
        },
      });
    }

    return NextResponse.json({
      success: true,
      name: parsed.name,
      description: parsed.description,
      category: parsed.category,
      status: parsed.status,
      priority: parsed.priority,
      health: parsed.health,
      estimatedHours: parsed.estimatedHours,
    });
  } catch (error: any) {
    console.error("Project Copilot API Error:", error);
    return NextResponse.json(
      { success: false, error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
