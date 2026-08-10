import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Ministry } from "@/models/Ministry";
import { Transaction } from "@/models/Transaction";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "No voice text provided" }, { status: 400 });
    }

    await connectDB();
    
    // Fetch ministries to give context to the parser
    const ministries = await Ministry.find({ active: true }).lean();
    if (ministries.length === 0) {
       return NextResponse.json({ error: "You must create at least one Ministry first." }, { status: 400 });
    }

    const lowerText = text.toLowerCase();

    // 1. Extract Amount
    const amountMatch = text.match(/\b\d+(?:,\d{3})*(?:\.\d{1,2})?\b/);
    if (!amountMatch) {
      return NextResponse.json({ error: "Could not detect an amount. Say something like 'Spent 500 on lunch'." }, { status: 400 });
    }
    const amount = parseFloat(amountMatch[0].replace(/,/g, ''));

    // 2. Determine Type
    const incomeKeywords = ["got", "received", "earned", "income", "salary", "won", "credited"];
    const isIncome = incomeKeywords.some(w => lowerText.includes(w)) && !lowerText.includes("spent");
    const type = isIncome ? "INCOME" : "EXPENSE";

    // 3. Determine Ministry Category (Heuristic Matching)
    let ministryId = ministries[0]._id; // Default fallback
    let foundMatch = false;

    // Direct match with ministry name
    for (const m of ministries) {
      if (lowerText.includes(m.name.toLowerCase())) {
        ministryId = m._id;
        foundMatch = true;
        break;
      }
    }

    // Fuzzy keyword matching if direct name fails
    if (!foundMatch) {
      const categoryKeywords: Record<string, string[]> = {
        "food": ["lunch", "dinner", "breakfast", "groceries", "restaurant", "cafe", "coffee", "snack", "eat", "swiggy", "zomato"],
        "transport": ["fuel", "gas", "petrol", "uber", "taxi", "bus", "train", "flight", "car", "ola", "auto", "metro"],
        "housing": ["rent", "electricity", "water", "wifi", "internet", "maintenance", "bill", "home"],
        "entertainment": ["movie", "game", "netflix", "party", "club", "concert", "fun", "amazon prime"],
        "health": ["doctor", "medicine", "pharmacy", "hospital", "clinic", "medical"],
        "education": ["book", "course", "school", "college", "tuition", "fee"]
      };

      for (const [cat, words] of Object.entries(categoryKeywords)) {
        if (words.some(w => lowerText.includes(w))) {
          // Find a ministry that loosely matches this category concept
          const matchedMin = ministries.find(m => m.name.toLowerCase().includes(cat) || m.name.toLowerCase().includes("misc"));
          if (matchedMin) {
            ministryId = matchedMin._id;
            foundMatch = true;
            break;
          }
        }
      }
    }

    // 4. Clean up description
    let description = text.replace(amountMatch[0], "").trim();
    // Remove filler words
    const fillers = [/^i spent/i, /^spent/i, /^i bought/i, /^bought/i, /^paid/i, /^got/i, /^received/i, /rupees/i, /dollars/i, /^on/i, /^for/i];
    for (const regex of fillers) {
      description = description.replace(regex, "").trim();
    }
    // Capitalize first letter
    if (description.length > 0) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    } else {
      description = isIncome ? "Income" : "Expense";
    }

    // Truncate if too long
    if (description.length > 40) description = description.substring(0, 40) + "...";

    // Create the transaction
    const transaction = await Transaction.create({
      amount,
      description,
      type,
      ministryId,
      date: new Date(),
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    console.error("Local Voice Parser Error:", error);
    return NextResponse.json(
      { error: "Failed to parse voice transaction locally." }, 
      { status: 500 }
    );
  }
}
