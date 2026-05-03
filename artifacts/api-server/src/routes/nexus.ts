import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { NexusAnalyzeBody as NexusAnalyzeBodySchema } from "@workspace/api-zod";

const router = Router();

router.post("/nexus/analyze", async (req, res) => {
  const parsed = NexusAnalyzeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }

  const { projectName, projectType, stage, chain, communitySize, goals, description } = parsed.data;

  const prompt = `You are NEXUS, a Web3 ecosystem intelligence agent. Your role is to analyze Web3 projects and generate actionable connection strategies.

Analyze this project and return a JSON response:

PROJECT INPUT:
- Name: ${projectName}
- Type: ${projectType}
- Stage: ${stage}
- Primary Chain: ${chain}
- Community Size: ${communitySize ?? "unknown"}
- Goals: ${goals?.join(", ") ?? "not specified"}
- Description: ${description ?? "not provided"}

Return EXACTLY this JSON structure (no markdown, no code blocks, pure JSON):
{
  "recommendedIntegrations": [
    { "name": "string", "reason": "string", "impact": "high|medium|low" }
  ],
  "partnerships": [
    { "name": "string", "type": "string", "synergy": "string" }
  ],
  "expansionStrategy": {
    "primaryChains": ["string"],
    "timeline": "string",
    "rationale": "string"
  },
  "capitalStrategy": {
    "fundingStage": "string",
    "investorTypes": ["string"],
    "estimatedRange": "string"
  },
  "networkScore": <integer 0-100>,
  "summary": "string"
}

Rules:
- recommendedIntegrations: 4-6 specific protocols/tools (e.g. Uniswap, Chainlink, Aave, OpenZeppelin)
- partnerships: 3-5 specific DAOs/protocols/projects to partner with
- expansionStrategy.primaryChains: 2-4 specific chains to expand to
- networkScore: score from 0-100 representing project's connection potential
- summary: 2-3 sentence strategic summary
- Be specific to the project type and stage, not generic
- For stage "idea": focus on building and validation
- For stage "mvp": focus on early partnerships and liquidity
- For stage "growth": focus on multi-chain expansion and integrations
- For stage "scale": focus on institutional and cross-ecosystem`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: "You are a Web3 ecosystem intelligence system. Always respond with valid JSON only, no markdown formatting." },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
    }

    res.json(analysis);
  } catch (err) {
    req.log.error({ err }, "NEXUS analyze failed");
    res.status(500).json({ error: "Analysis failed" });
  }
});

export default router;
