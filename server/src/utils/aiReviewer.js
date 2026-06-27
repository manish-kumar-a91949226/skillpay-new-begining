/**
 * Optional bonus feature: asks Gemini to review a submitted project and
 * return a structured score. Returns null (no-op) if GEMINI_API_KEY is not
 * configured, so the rest of the app works fine without it.
 */
export async function reviewWithGemini({ githubLink, demoLink, notes, title }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are reviewing a learner's project submission for a coding challenge titled "${title}".
GitHub: ${githubLink}
Demo: ${demoLink || "none provided"}
Learner notes: ${notes || "none provided"}

Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{
  "summary": "2-3 sentence summary of the project",
  "strengths": ["short strength 1", "short strength 2"],
  "suggestions": ["short suggestion 1", "short suggestion 2"],
  "codeQualityScore": 0,
  "documentationScore": 0,
  "innovationScore": 0
}
Scores are integers from 0-10.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
