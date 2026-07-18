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
        {
          success: false,
          error: "Groq API key not configured on server.",
        },
        { status: 500 }
      );
    }

    const { prompt, workspaceId, userName, userEmail } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "A valid prompt description is required.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `You are ANSH Copilot, an AI assistant built for MSME team workspaces.
Your task is to generate a professional, clear, and engaging team announcement based on the user's instructions.
Format the title and body with appropriate corporate vocabulary while keeping it friendly and readable for small businesses.

Respond ONLY with a valid JSON object matching this schema:
{
  "title": "String (compelling headline, max 10 words)",
  "body": "String (detailed message, use paragraphs if needed)"
}

Do not include markdown wrappers, triple backticks, or extra commentary. Output only raw JSON.`;

    const requestBody = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    };

    let groqResponse;
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
          console.warn(`Primary Groq API key failed (status: ${groqResponse.status}). Trying fallback API key...`);
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
        console.log("Trying fallback Groq API key after exception...");
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
      console.error(`Groq API returned error status ${errStatus}:`, errText);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to communicate with Groq AI API.",
        },
        { status: 502 }
      );
    }

    const data = await groqResponse.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      return NextResponse.json(
        {
          success: false,
          error: "No response returned from Groq AI API.",
        },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(resultText);

    // Save AI usage log
    if (parsed && parsed.title && parsed.body) {
      await prisma.aiUsageLog.create({
        data: {
          userName: userName || "Unknown User",
          userEmail: userEmail || "unknown@domain.com",
          action: "AI Announcement Draft",
          creditConsumed: 1,
          workspaceId: Number(workspaceId || 1),
        },
      });
    }

    return NextResponse.json({
      success: true,
      title: parsed.title,
      body: parsed.body,
    });
  } catch (error: any) {
    console.error("Announcement Copilot API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An internal server error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
