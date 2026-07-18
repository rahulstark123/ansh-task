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

    const {
      employeeName,
      role,
      department,
      designation,
      joinedDate,
      reportsTo,
      tasks,
      workspaceId,
      userName,
      userEmail,
    } = await request.json();

    if (!employeeName || typeof employeeName !== "string") {
      return NextResponse.json(
        { success: false, error: "Employee name is required." },
        { status: 400 }
      );
    }

    // Build task context string
    const taskLines =
      Array.isArray(tasks) && tasks.length > 0
        ? tasks
            .map(
              (t: any, i: number) =>
                `${i + 1}. "${t.title}" — Project: ${t.project || "N/A"}, Status: ${t.status || "N/A"}, Progress: ${t.progress ?? 0}%`
            )
            .join("\n")
        : "No tasks assigned.";

    const systemPrompt = `You are ANSH Copilot, an intelligent HR and team analytics assistant for MSME workspaces.

Your task is to produce a clear, professional employee performance summary based on the information provided.

Structure your summary in EXACTLY this format (use these exact section headers):

**Employee Overview**
2-3 sentences about who this employee is, their role and tenure.

**Task Performance**
2-3 bullet points covering the employee's tasks, progress, and completion rate.

**Key Highlights**
2-3 bullet points with positive observations or noteworthy achievements.

**Areas of Attention**
1-2 bullet points on pending items, overdue work, or anything needing management attention. If everything looks fine, say so briefly.

**Manager's Note**
One sentence summarizing overall performance in a constructive and professional manner.

Keep the tone professional and concise. Do not add extra section headers or markdown decorations outside of what is specified.`;

    const userMessage = `Generate a summary for this team member:

Name: ${employeeName}
Role: ${role || "Member"}
Department: ${department || "N/A"}
Designation: ${designation || "N/A"}
Joined: ${joinedDate || "N/A"}
Reports To: ${reportsTo || "None"}

Tasks:
${taskLines}`;

    const requestBody = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 600,
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
      console.error("Exception during Groq employee summary request:", err);
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
      console.error(`Groq Employee Summary API error ${errStatus}:`, errText);
      return NextResponse.json(
        { success: false, error: "Failed to communicate with Groq AI API." },
        { status: 502 }
      );
    }

    const data = await groqResponse.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { success: false, error: "No summary returned from Groq AI API." },
        { status: 502 }
      );
    }

    // Log credit usage — Employee Summary costs 5 credits
    await prisma.aiUsageLog.create({
      data: {
        userName: userName || "Unknown User",
        userEmail: userEmail || "unknown@domain.com",
        action: `Employee Summary — ${employeeName}`,
        creditConsumed: 5,
        workspaceId: Number(workspaceId || 1),
      },
    });

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("Employee Summary API Error:", error);
    return NextResponse.json(
      { success: false, error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
