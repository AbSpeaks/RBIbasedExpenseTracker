import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Ministry } from "@/models/Ministry";
import { Transaction } from "@/models/Transaction";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy", // Allow it to initialize, but it will throw on API call if dummy
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in environment variables." }, { status: 400 });
    }

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "No voice text provided" }, { status: 400 });
    }

    await connectDB();
    
    // Fetch ministries to give context to the AI
    const ministries = await Ministry.find({ active: true }).lean();
    const ministryContext = ministries.map(m => `- ID: ${m._id.toString()} | Name: ${m.name}`).join("\n");

    const systemPrompt = `
You are a highly precise financial assistant for the 'Reserve Bank of Abin'.
The user will provide a transcribed voice message of a financial transaction.
You must extract the information and return a strict JSON object.

Available Ministries (Categories):
${ministryContext}

JSON Schema:
{
  "amount": number (positive integer/float),
  "description": string (short, clean description, e.g., 'Lunch at Cafe'),
  "type": "EXPENSE" | "INCOME",
  "ministryId": string (The exact ID from the list above that best fits this transaction)
}

Rules:
- If it's a purchase/spending, set type to "EXPENSE".
- If it's receiving money, set type to "INCOME".
- If no ministry perfectly fits, pick the closest match or the most generic one.
- DO NOT wrap the JSON in markdown blocks like \`\`\`json. Return raw JSON.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fast, cheap, and very smart
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0,
    });

    const resultText = response.choices[0].message.content;
    if (!resultText) throw new Error("No response from OpenAI");

    const parsedData = JSON.parse(resultText);

    // Create the transaction
    const transaction = await Transaction.create({
      amount: parsedData.amount,
      description: parsedData.description,
      type: parsedData.type,
      ministryId: parsedData.ministryId,
      date: new Date(),
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    console.error("Voice AI Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process voice transaction." }, 
      { status: 500 }
    );
  }
}
