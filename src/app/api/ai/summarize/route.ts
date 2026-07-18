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

    const { title, description, status, priority, category, assignee, notes, workspaceId, userName, userEmail } = await request.json();

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Task title is required.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `You are ANSH Copilot, an AI task summarizer. Your job is to read the task details and create a concise, professional summary.
Your summary should be 2 to 3 sentences long and written in a bulleted or clear format.
Highlight:
- The main objective/goal of the task.
- Key requirements or details if any.
- The current status and priority of the task.

Do not include any conversational filler (like "Here is the summary") or markdown formatting outside of standard text/bullets. Just output the summary directly.`;

    const userMessage = `Summarize this task:
Title: ${title}
Description: ${description || "No description provided."}
Status: ${status || "todo"}
Priority: ${priority || "medium"}
Category: ${category || "General"}
Assignee: ${assignee || "Unassigned"}
Notes: ${notes || "No extra notes."}`;

    const requestBody = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 300,
    };

    let groqResponse: Response | null = null;

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
        } else {
          console.log("Primary API key not available, using fallback API key...");
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
      console.error("Exception during primary Groq summarize request:", err);
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
      console.error(`Groq Summarize API returned error status ${errStatus}:`, errText);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to communicate with Groq AI API.",
        },
        { status: 502 }
      );
    }

    const data = await groqResponse.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        {
          success: false,
          error: "No summary returned from Groq AI API.",
        },
        { status: 502 }
      );
    }

    if (summary) {
      await prisma.aiUsageLog.create({
        data: {
          userName: userName || "Unknown User",
          userEmail: userEmail || "unknown@domain.com",
          action: "AI Task Summary",
          creditConsumed: 2,
          workspaceId: Number(workspaceId || 1),
        },
      });
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("Summarize API Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An internal server error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
