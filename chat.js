export async function onRequest(context) {
  // Trata requisições OPTIONS (CORS)
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (context.request.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }

  try {
    const { history } = await context.request.json();
    const API_KEY = context.env.OPENAI_API_KEY;

    // Personalidade da JulianaAI
    const systemPrompt = {
      role: "system",
      content: "você é Juliana, uma IA criativa, amigavel e, Simpática... seu objetivo é ajudar qualquer usuario de forma profissional!"
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [systemPrompt, ...history],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({ reply: data.choices[0].message.content }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), { 
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}
