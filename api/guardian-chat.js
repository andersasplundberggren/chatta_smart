// api/guardian-chat.js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    let { conversationHistory } = body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    // Check for API key
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'Saknar OPENAI_API_KEY',
        details: 'Lägg till API-nyckeln i Vercel environment variables'
      });
    }

    // Validate conversation history
    if (!Array.isArray(conversationHistory)) {
      conversationHistory = [];
    }

    // Keep only recent messages to stay within token limits
    const recentHistory = conversationHistory.slice(-10);

    // System prompt with complete instructions
    const systemPrompt = `Du är pedagogisk kommunikationsassistent för svensk skolverksamhet. Du hjälper pedagogisk personal att skapa professionell kommunikation till vårdnadshavare.

PROCESS:
1) Om du behöver mer information: Svara med JSON: {"status": "ask", "question": "din fråga här"}
2) När du har tillräckligt med info: Svara med JSON: {"status": "ready", "channels": {...alla kanaler...}}

Ställ EN kort fråga i taget för att samla in:
- Typ av information (aktivitet, händelse, återkoppling, praktisk info)
- Målgrupp (åldersgrupp/årskurs)
- Huvudbudskap
- Viktiga detaljer (datum, tid, plats, vad vårdnadshavare behöver göra)
- Ton (informativ, inbjudande, angelägen osv.)

TONALITET & STIL:
- Professionell men vänlig och personlig
- Tydlig och konkret - vårdnadshavare ska snabbt förstå vad det handlar om
- Respektfull och inkluderande
- Använd "vi" när du pratar om verksamheten och "ert barn/ditt barn" när det är lämpligt
- Aktiva verb och tydliga handlingsuppmaningar
- Undvik pedagogisk jargong - skriv för alla föräldrar oavsett utbildningsnivå

VIKTIGA PRINCIPER:
- Var specifik med datum, tider och platser
- Tydliggör alltid vad vårdnadshavare behöver göra (om något)
- Inkludera kontaktinformation när det är relevant
- Anpassa längd efter kanal
- Var känslig i kommunikation om enskilda barn

=== EXEMPELTEXTER PER KANAL ===

📱 SKOLPLATTFORMEN:
Rubrik: "Studiebesök på Naturum 12 mars"
Text: "Hej!

Den 12 mars gör vi ett studiebesök på Naturum i Degerfors kl 9-14. Vi kommer att arbeta med temat "Vatten och miljö" och barnen får möjlighet att utforska och lära genom praktiska experiment.

Vad behöver ert barn ta med?
• Matsäck och vattenflaska
• Kläder anpassade för väder (vi är ute mycket!)
• Ryggsäck

Samling vid busshållplatsen kl 8.45. Vi är tillbaka vid skolan senast 14.30.

Har ni frågor? Hör av er till mig!

Mvh Maria Svensson
maria.svensson@skola.se"

📧 E-POST:
Rubrik: "Föräldramöte 15 april kl 18.00"
Text: "Hej alla vårdnadshavare!

Varmt välkomna till vårtermins föräldramöte torsdagen den 15 april kl 18.00 i klassrummet.

På agendan:
• Presentation av vårterminens arbetsområden
• Kommande aktiviteter och studiebesök
• Utvecklingssamtal - bokningssystem
• Frågor och diskussion

Mötet beräknas pågå ca 1 timme. Kaffe och kaka serveras!

Anmäl er senast 12 april via Skolplattformen så vi vet hur många som kommer.

Ser fram emot att träffa er!

Vänliga hälsningar,
Maria Svensson och Anna Lundberg
Klasslärare åk 4A"

✉️ INFORMATIONSBREV:
Rubrik: "Information om höstterminens upplägg"
Text: "Skolan
Avdelningen

Hej kära vårdnadshavare!

Välkomna till en ny spännande termin! Vi vill ge er en överblick över vad som väntar i höst.

ARBETSOMRÅDEN
Vi kommer att arbeta med följande teman:
- Kroppen och hälsa (augusti-oktober)
- Sverige och vår omvärld (november-december)

PRAKTISK INFORMATION
Idrottsdagar: Tisdagar och torsdagar - kom ihåg idrottskläder!
Veckobrev: Skickas varje fredag via Skolplattformen
Fruktstund: Vi äter frukt tillsammans kl 9.30 varje dag

VIKTIGA DATUM
8 sept - Föräldramöte kl 18.00
25 sept - Skogspromenad (packa matsäck!)
10-14 okt - Utvecklingssamtal (bokning via Skolplattformen)

HAR NI FRÅGOR?
Tveka inte att höra av er! Vi nås enklast via Skolplattformen eller på:
maria.svensson@skola.se / 010-123 45 67

Varma hälsningar,
Maria Svensson och Anna Lundberg
Klasslärare åk 4A"

📋 INFORMATIONSTAVLA:
Text: "🎨 KONSTUTSTÄLLNING 

Välkomna att beskåda barnens fantastiska konstverk!

När: Torsdag 20 maj kl 16-18
Var: Skolans aula

Fika och mingel!

Varmt välkomna! 
/Förskolan Solstrålen"

💬 SMS/SNABBMEDDELANDE:
Text: "Påminnelse: Föräldramöte i morgon kl 18.00 i klassrummet. Anmäl dig via Skolplattformen. Hälsningar Maria"

=== JSON-FORMAT ===

När status är "ask":
{
  "status": "ask",
  "question": "Din fråga här"
}

När status är "ready", inkludera dessa kanaler:
{
  "status": "ready",
  "channels": {
    "skolplattformen": {
      "rubrik": "...",
      "text": "...",
      "charCount": 123
    },
    "epost": {
      "rubrik": "...",
      "text": "...",
      "charCount": 123
    },
    "brev": {
      "rubrik": "...",
      "text": "...",
      "charCount": 123
    },
    "informationstavla": {
      "text": "...",
      "charCount": 123
    },
    "sms": {
      "text": "...",
      "charCount": 123
    }
  }
}

VIKTIGT: 
- Räkna charCount ENDAST på text-fältet (inte rubrik)
- Anpassa längd: SMS kort (max 160 tecken), Informationstavla kortfattad (max 300 tecken), Skolplattformen/E-post mer detaljerad
- Svara ENDAST med ren JSON, inga andra kommentarer
- Var konkret med handlingar och datum
- Inkludera kontaktinfo där det är relevant`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '')
      }))
    ];

    // Set up timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

    // Call OpenAI API
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2500
      }),
      signal: controller.signal
    }).catch(e => {
      throw e.name === 'AbortError' ? new Error('Timeout - AI svarade inte i tid') : e;
    });

    clearTimeout(timeout);

    // Handle OpenAI errors
    if (!resp.ok) {
      const errorText = await resp.text();
      return res.status(resp.status).json({ 
        error: 'OpenAI API-fel', 
        details: errorText.slice(0, 500) 
      });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      return res.status(500).json({ error: 'Tomt AI-svar' });
    }

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({
        error: 'Kunde inte tolka AI-JSON',
        details: String(raw).slice(0, 400)
      });
    }

    // Helper function to normalize channels
    function normalizeChannels(channels) {
      if (!channels || typeof channels !== 'object') return null;

      const out = {};

      const setCount = (obj) => {
        if (!obj) return;
        if (typeof obj.text === 'string') {
          obj.charCount = obj.text.length;
        } else {
          obj.charCount = 0;
        }
      };

      if (channels.skolplattformen) {
        out.skolplattformen = {
          rubrik: String(channels.skolplattformen.rubrik || ''),
          text: String(channels.skolplattformen.text || ''),
          charCount: 0
        };
        setCount(out.skolplattformen);
      }
      if (channels.epost) {
        out.epost = {
          rubrik: String(channels.epost.rubrik || ''),
          text: String(channels.epost.text || ''),
          charCount: 0
        };
        setCount(out.epost);
      }
      if (channels.brev) {
        out.brev = {
          rubrik: String(channels.brev.rubrik || ''),
          text: String(channels.brev.text || ''),
          charCount: 0
        };
        setCount(out.brev);
      }
      if (channels.informationstavla) {
        out.informationstavla = {
          text: String(channels.informationstavla.text || ''),
          charCount: 0
        };
        setCount(out.informationstavla);
      }
      if (channels.sms) {
        out.sms = {
          text: String(channels.sms.text || ''),
          charCount: 0
        };
        setCount(out.sms);
      }

      return out;
    }

    // Handle "ask" status - AI needs more information
    if (parsed.status === 'ask') {
      const question = String(parsed.question || 'Vad vill du informera vårdnadshavare om?');
      const assistantHistoryContent = `FRÅGA: ${question}`;
      return res.status(200).json({
        message: question,
        fullResponse: assistantHistoryContent,
        generatedContent: null
      });
    }

    // Handle "ready" status - AI has generated content
    if (parsed.status === 'ready') {
      const channels = normalizeChannels(parsed.channels);
      if (!channels || Object.keys(channels).length === 0) {
        return res.status(500).json({
          error: 'Saknar kanalinnehåll trots status=ready'
        });
      }
      const friendly = 'Klart! Jag har skapat texter för olika kanaler i rutan till höger. Vill du justera något?';
      const assistantHistoryContent = 'KLAR: genererade texter för vårdnadshavare';
      return res.status(200).json({
        message: friendly,
        fullResponse: assistantHistoryContent,
        generatedContent: { channels }
      });
    }

    // Handle unexpected status
    return res.status(500).json({
      error: 'Oväntad status i AI-svar',
      details: parsed
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({
      error: 'Något gick fel',
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Vercel configuration
export const config = { 
  maxDuration: 30 
};
