import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sprout, Thermometer, Droplets, Cloud } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const result = location.state;

  useEffect(() => {
    if (result) {
      savePrediction();
    }
  }, [result]);

  const savePrediction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("crop_predictions").insert({
        user_id: user.id,
        nitrogen: parseFloat(result.soil.nitrogen),
        phosphorus: parseFloat(result.soil.phosphorus),
        potassium: parseFloat(result.soil.potassium),
        ph_value: parseFloat(result.soil.ph),
        rainfall: parseFloat(result.soil.rainfall),
        temperature: result.weather.temperature,
        humidity: result.weather.humidity,
        predicted_crop: result.crop,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error saving prediction:", error);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center mb-4">No prediction data found</p>
            <Button onClick={() => navigate("/app")} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Button variant="ghost" onClick={() => navigate("/app")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Sprout className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl">Recommended Crop</CardTitle>
            <CardDescription className="text-2xl font-bold text-primary mt-2">
              {result.crop}
            </CardDescription>
            {result.confidence && (
              <p className="text-sm text-muted-foreground mt-2">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </p>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Weather Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  Temperature
                </span>
                <span className="font-semibold">{result.weather.temperature}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Humidity
                </span>
                <span className="font-semibold">{result.weather.humidity}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Soil Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Nitrogen (N)</span>
                <span className="font-semibold">{result.soil.nitrogen}</span>
              </div>
              <div className="flex justify-between">
                <span>Phosphorus (P)</span>
                <span className="font-semibold">{result.soil.phosphorus}</span>
              </div>
              <div className="flex justify-between">
                <span>Potassium (K)</span>
                <span className="font-semibold">{result.soil.potassium}</span>
              </div>
              <div className="flex justify-between">
                <span>pH Level</span>
                <span className="font-semibold">{result.soil.ph}</span>
              </div>
              <div className="flex justify-between">
                <span>Rainfall</span>
                <span className="font-semibold">{result.soil.rainfall} mm</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={() => navigate("/app")} className="w-full">
          Make Another Prediction
        </Button>
      </div>
    </div>
  );
};

export default Result;
