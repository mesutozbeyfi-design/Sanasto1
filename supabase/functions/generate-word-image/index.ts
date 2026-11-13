// AI image generation via Cloudflare Workers AI (Stable Diffusion XL)
// Two-step pipeline: LLM translates the word into an English image prompt, then SDXL generates the image.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const SDXL_MODEL = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
const LLM_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const NEGATIVE_PROMPT =
  "illustration, drawing, cartoon, anime, painting, sketch, text, letters, words, typography, watermark, signature, numbers, blurry, low quality, multiple subjects, collage, border, frame, abstract, surreal, distorted, deformed, oversaturated, plastic, 3d render, cgi, doll, mannequin, extra limbs, bad anatomy";
const RETRYABLE_STATUSES = new Set([429, 502, 503]);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface RequestBody {
  finnish?: string;
  turkish?: string;
}

/** Ask the LLM to produce a concise English image-generation prompt for the given word. */
async function buildEnglishPrompt(
  accountId: string,
  apiToken: string,
  finnish: string,
  turkish: string,
): Promise<string> {
  const systemMessage =
    "You are an expert at writing image generation prompts for Stable Diffusion XL. " +
    "The user gives you a word in Finnish and its Turkish meaning. " +
    "Your job is to output a single English prompt that produces a photorealistic image instantly recognizable as depicting this exact word.\n" +
    "Rules:\n" +
    "- Output ONLY the English prompt — no explanations, no quotes, no labels, no prefixes.\n" +
    "- Start with the central subject and make it the ONLY focus of the image (single subject, centered, filling most of the frame).\n" +
    "- For concrete nouns (objects, animals, food, places, body parts): describe the specific item in a natural real-world setting with realistic lighting.\n" +
    "- For verbs / actions: describe a person clearly performing that exact action in a recognizable way.\n" +
    "- For adjectives (colors, sizes, qualities): show a clear real-world example where that quality is the dominant visible feature.\n" +
    "- For abstract concepts: use the most universally recognized visual metaphor for that concept, depicted as a real scene.\n" +
    "- Always include these photographic quality keywords: 'professional photography, realistic, high detail, sharp focus, natural lighting, shallow depth of field'.\n" +
    "- Be specific: name the exact object, animal, or scene — never use vague words like 'thing', 'object', 'something'.\n" +
    "- Do NOT include any text, letters, words, or writing in the image.\n" +
    "- Keep the prompt between 30 and 70 words.\n" +
    "- The image must be 1:1 aspect ratio, square format.\n";

  const userMessage = `Finnish word: ${finnish.trim()}\nTurkish meaning: ${turkish.trim()}\nEnglish SDXL prompt:`;

  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${LLM_MODEL}`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      max_tokens: 200,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("LLM prompt generation failed", response.status, errorText);
    throw new Error("prompt_generation_failed");
  }

  const data = (await response.json()) as { result?: { response?: string }; response?: string };
  const rawPrompt = (data.result?.response ?? data.response ?? "").trim();
  const cleanPrompt = rawPrompt
    .replace(/^```(?:text|txt|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^["'`]|["'`]$/g, "")
    .trim();
  if (!cleanPrompt) throw new Error("empty_prompt");
  return cleanPrompt;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = (await req.json()) as RequestBody;
    const finnish = typeof body.finnish === "string" ? body.finnish.trim() : "";
    const turkish = typeof body.turkish === "string" ? body.turkish.trim() : "";
    if (!finnish || !turkish) {
      return json({ error: "finnish and turkish are required" }, 400);
    }
    if (finnish.length > 200 || turkish.length > 300) {
      return json({ error: "word_too_long" }, 400);
    }

    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    if (!accountId || !apiToken) {
      return json({ error: "cloudflare_not_configured" }, 500);
    }

    // Step 1: Use an LLM to translate the word into an English image prompt.
    // SDXL does not understand Turkish or Finnish, so we must produce an English description.
    let imagePrompt: string;
    try {
      imagePrompt = await buildEnglishPrompt(accountId, apiToken, finnish, turkish);
    } catch (error) {
      console.error("Could not create a reliable English image prompt", error);
      return json({ error: "prompt_generation_failed" }, 502);
    }

    // Never send Finnish or Turkish text directly to SDXL: it can interpret those words as unrelated concepts.
    // Step 2: Generate the image with the verified English prompt.
    const sdApiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${SDXL_MODEL}`;
    let cfResponse: Response | null = null;
    let responseContentType = "";
    let responseBuffer = new Uint8Array();
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      cfResponse = await fetch(sdApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          negative_prompt: NEGATIVE_PROMPT,
          num_steps: 20,
          guidance: 7.5,
          width: 1024,
          height: 1024,
        }),
      });
      responseContentType = cfResponse.headers.get("content-type") ?? "";
      responseBuffer = new Uint8Array(await cfResponse.arrayBuffer());
      if (!RETRYABLE_STATUSES.has(cfResponse.status) || attempt === MAX_RETRIES) break;
      await wait(RETRY_DELAY_MS);
    }
    if (!cfResponse) {
      return json({ error: "image_generation_failed" }, 502);
    }
    if (!cfResponse.ok) {
      const responseText = new TextDecoder().decode(responseBuffer);
      console.error("Cloudflare AI error", cfResponse.status, responseText);
      return json({ error: "image_generation_failed" }, 502);
    }

    let imageBuffer: Uint8Array;
    let contentType = "image/jpeg";
    if (responseContentType.includes("application/json")) {
      let responseData: { result?: { image?: string } };
      try {
        responseData = JSON.parse(new TextDecoder().decode(responseBuffer)) as { result?: { image?: string } };
      } catch {
        console.error("Cloudflare AI returned invalid JSON");
        return json({ error: "invalid_image_response" }, 502);
      }

      const base64Image = responseData.result?.image;
      if (!base64Image) {
        console.error("Cloudflare AI response did not contain result.image");
        return json({ error: "empty_image" }, 502);
      }

      try {
        const binary = atob(base64Image);
        imageBuffer = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      } catch {
        console.error("Cloudflare AI returned invalid base64 image data");
        return json({ error: "invalid_image_data" }, 502);
      }
    } else if (responseContentType.startsWith("image/")) {
      imageBuffer = responseBuffer;
      contentType = responseContentType.split(";")[0];
    } else {
      console.error("Cloudflare AI returned an unsupported response type", responseContentType);
      return json({ error: "invalid_image_response" }, 502);
    }

    if (imageBuffer.byteLength === 0) {
      return json({ error: "empty_image" }, 502);
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const extension = contentType === "image/png" ? "png" : "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const path = `ai/${fileName}`;
    const { error: uploadError } = await admin.storage
      .from("word-images")
      .upload(path, imageBuffer, { contentType, upsert: false });

    if (uploadError) {
      console.error("Storage upload error", uploadError);
      return json({ error: "storage_failed" }, 500);
    }

    const { data } = admin.storage.from("word-images").getPublicUrl(path);
    return json({ url: data.publicUrl, prompt: imagePrompt });
  } catch (err) {
    console.error("generate-word-image failed", err);
    return json({ error: "server_error" }, 500);
  }
});
