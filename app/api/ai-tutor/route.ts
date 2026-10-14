import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type TutorContext = {
  subject?: string;
  topic?: string;
  materialTitle?: string | null;
  courseId?: number | null;
  courseCode?: string | null;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is missing from .env.local",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const messages = body.messages as ChatMessage[];

    const context =
      (body.context as TutorContext) || {};

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Please provide a question.",
        },
        { status: 400 }
      );
    }

    const safeMessages = messages
      .filter(
        (message) =>
          message &&
          (message.role === "user" ||
            message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0
      )
      .slice(-12)
      .map((message) => ({
        role: message.role,
        content: message.content
          .trim()
          .slice(0, 4000),
      }));

    if (safeMessages.length === 0) {
      return NextResponse.json(
        {
          error: "Please provide a valid question.",
        },
        { status: 400 }
      );
    }

    const systemInstruction = `
You are EDUQUEST AI Tutor, an educational assistant.

For school students:
- Explain concepts clearly and at an age-appropriate level.
- Teach instead of simply giving answers.
- Break difficult concepts into simple steps.
- Use examples when useful.
- Encourage independent thinking.
- Be accurate and honest.
- Do not pretend you have read a file when its contents were not provided.

For college students:
- Give deeper technical explanations when appropriate.
- Help with research, programming, academic concepts, and structured reasoning.
- Distinguish facts from suggestions or interpretations.
- Do not fabricate sources or references.

Response rules:
- Always finish the answer.
- Do not stop in the middle of a sentence, list, table, or section.
- For simple questions, give a concise but complete explanation.
- For broad questions, prioritize the most important concepts.
- Prefer clear headings and short paragraphs.
- Use examples when they improve understanding.
- Do not add unnecessary information just to make the answer longer.
- Make the answer complete before reaching the output limit.
- For definitions, start with a clear definition, then explain with an example.
- When comparing concepts, use a simple table or clearly separated sections when helpful.
- For programming questions, use code examples only when useful.
- Do not invent citations, books, sources, or research papers.

Current learning context:
Subject: ${context.subject || "Not specified"}
Topic: ${context.topic || "Not specified"}
Material: ${context.materialTitle || "None selected"}
Course ID: ${context.courseId ?? "None"}
Course Code: ${context.courseCode || "None"}

Always answer in a clear educational style.
`;

    const contents = safeMessages.map((message) => ({
      role:
        message.role === "assistant"
          ? "model"
          : "user",
      parts: [
        {
          text: message.content,
        },
      ],
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: systemInstruction,
              },
            ],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 3000,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Gemini could not generate a response.",
        },
        {
          status: response.status,
        }
      );
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(
          (part: { text?: string }) =>
            part.text || ""
        )
        .join("")
        .trim();

    if (!answer) {
      return NextResponse.json(
        {
          error:
            "Gemini returned an empty response.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.error(
      "Gemini AI Tutor server error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not connect to Gemini. Please try again.",
      },
      { status: 500 }
    );
  }
}