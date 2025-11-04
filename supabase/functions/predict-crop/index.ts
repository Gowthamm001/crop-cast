import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const predictionSchema = z.object({
  nitrogen: z.number().min(0).max(1000),
  phosphorus: z.number().min(0).max(1000),
  potassium: z.number().min(0).max(1000),
  ph: z.number().min(0).max(14),
  rainfall: z.number().min(0).max(1000),
  temperature: z.number().min(-50).max(60),
  humidity: z.number().min(0).max(100),
});

// Simple crop recommendation logic based on NPK values and environmental conditions
const predictCrop = (params: {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  rainfall: number;
  temperature: number;
  humidity: number;
}) => {
  const { nitrogen, phosphorus, potassium, ph, rainfall, temperature, humidity } = params;

  // Calculate scores for different crops
  const crops = [
    {
      name: "Rice",
      score:
        (nitrogen > 80 ? 1 : 0) +
        (phosphorus > 40 ? 1 : 0) +
        (potassium > 40 ? 1 : 0) +
        (ph >= 5 && ph <= 7 ? 1 : 0) +
        (rainfall > 200 ? 1 : 0) +
        (temperature >= 20 && temperature <= 35 ? 1 : 0) +
        (humidity > 80 ? 1 : 0),
    },
    {
      name: "Wheat",
      score:
        (nitrogen > 50 && nitrogen < 100 ? 1 : 0) +
        (phosphorus > 30 ? 1 : 0) +
        (potassium > 30 ? 1 : 0) +
        (ph >= 6 && ph <= 7.5 ? 1 : 0) +
        (rainfall >= 50 && rainfall <= 100 ? 1 : 0) +
        (temperature >= 15 && temperature <= 25 ? 1 : 0) +
        (humidity >= 50 && humidity <= 70 ? 1 : 0),
    },
    {
      name: "Maize",
      score:
        (nitrogen > 60 ? 1 : 0) +
        (phosphorus > 35 ? 1 : 0) +
        (potassium > 35 ? 1 : 0) +
        (ph >= 5.5 && ph <= 7.5 ? 1 : 0) +
        (rainfall >= 60 && rainfall <= 110 ? 1 : 0) +
        (temperature >= 18 && temperature <= 27 ? 1 : 0) +
        (humidity >= 60 && humidity <= 80 ? 1 : 0),
    },
    {
      name: "Cotton",
      score:
        (nitrogen > 70 ? 1 : 0) +
        (phosphorus > 40 ? 1 : 0) +
        (potassium > 40 ? 1 : 0) +
        (ph >= 5.8 && ph <= 8 ? 1 : 0) +
        (rainfall >= 60 && rainfall <= 120 ? 1 : 0) +
        (temperature >= 21 && temperature <= 30 ? 1 : 0) +
        (humidity >= 50 && humidity <= 80 ? 1 : 0),
    },
    {
      name: "Sugarcane",
      score:
        (nitrogen > 90 ? 1 : 0) +
        (phosphorus > 45 ? 1 : 0) +
        (potassium > 45 ? 1 : 0) +
        (ph >= 6 && ph <= 7.5 ? 1 : 0) +
        (rainfall > 150 ? 1 : 0) +
        (temperature >= 20 && temperature <= 30 ? 1 : 0) +
        (humidity > 75 ? 1 : 0),
    },
    {
      name: "Potato",
      score:
        (nitrogen >= 50 && nitrogen <= 80 ? 1 : 0) +
        (phosphorus > 30 ? 1 : 0) +
        (potassium > 50 ? 1 : 0) +
        (ph >= 5.2 && ph <= 6.5 ? 1 : 0) +
        (rainfall >= 50 && rainfall <= 100 ? 1 : 0) +
        (temperature >= 15 && temperature <= 25 ? 1 : 0) +
        (humidity >= 60 && humidity <= 80 ? 1 : 0),
    },
    {
      name: "Tomato",
      score:
        (nitrogen >= 60 && nitrogen <= 100 ? 1 : 0) +
        (phosphorus > 35 ? 1 : 0) +
        (potassium > 40 ? 1 : 0) +
        (ph >= 6 && ph <= 7 ? 1 : 0) +
        (rainfall >= 60 && rainfall <= 100 ? 1 : 0) +
        (temperature >= 20 && temperature <= 28 ? 1 : 0) +
        (humidity >= 60 && humidity <= 80 ? 1 : 0),
    },
  ];

  // Sort by score and return the best match
  crops.sort((a, b) => b.score - a.score);
  const bestCrop = crops[0];
  const confidence = bestCrop.score / 7;

  console.log(`Crop prediction: ${bestCrop.name} with confidence ${confidence}`);

  return {
    crop: bestCrop.name,
    confidence: confidence,
    alternativeCrops: crops.slice(1, 3).map((c) => c.name),
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const params = predictionSchema.parse(body);
    console.log('Received prediction request:', params);

    const prediction = predictCrop(params);

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in predict-crop function:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
