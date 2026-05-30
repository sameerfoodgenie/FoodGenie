import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64, scanType } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a product label recognition AI for a pantry management app. Analyze the provided product image and extract the following details:

1. product_name: The brand name and product name (e.g., "Amul Butter", "Fortune Sunflower Oil")
2. mrp: Maximum Retail Price in INR (number only, without currency symbol)
3. quantity: Pack size/weight (e.g., "500g", "1L", "200ml", "12 pcs")
4. batch_number: Batch/Lot number if visible
5. mfg_date: Manufacturing date (format: YYYY-MM-DD if possible, otherwise as shown)
6. expiry_date: Expiry/Best Before date (format: YYYY-MM-DD if possible, otherwise as shown)
7. category: Product category (Dairy, Grains & Staples, Vegetables, Fruits, Oils, Spices, Protein, Snacks, Beverages, Others)
8. brand: Brand name only

Return ONLY valid JSON in this exact format:
{
  "product_name": "string",
  "mrp": number or null,
  "quantity": "string",
  "batch_number": "string or null",
  "mfg_date": "string or null",
  "expiry_date": "string or null",
  "category": "string",
  "brand": "string"
}

If any field is not visible or unclear, set it to null. Always try your best to identify the product even if label is partially visible.`;

    const userPrompt = scanType === 'barcode'
      ? 'This image was captured from a barcode scan. Please identify the product and extract all visible label information including MRP, quantity, batch number, manufacturing date, and expiry date.'
      : 'Please analyze this product image/label and extract all product details including name, MRP, quantity, batch number, manufacturing date, and expiry date.';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI recognition failed', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Parse JSON from response
    let productInfo;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      productInfo = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      productInfo = {
        product_name: null,
        mrp: null,
        quantity: null,
        batch_number: null,
        mfg_date: null,
        expiry_date: null,
        category: 'Others',
        brand: null,
        raw_response: content,
      };
    }

    return new Response(JSON.stringify({ success: true, product: productInfo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Pantry scan error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
