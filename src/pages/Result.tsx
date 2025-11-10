import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sprout, Thermometer, Droplets, Cloud, Leaf } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const result = location.state?.result;

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
        nitrogen: parseFloat(result.soil?.nitrogen || 0),
        phosphorus: parseFloat(result.soil?.phosphorus || 0),
        potassium: parseFloat(result.soil?.potassium || 0),
        ph_value: parseFloat(result.soil?.ph || 0),
        rainfall: parseFloat(result.soil?.rainfall || 0),
        temperature: result.weather?.temperature || 0,
        humidity: result.weather?.humidity || 0,
        predicted_crop: result.crop || '',
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-primary" />
              Current Weather Conditions
            </CardTitle>
            <CardDescription>Environmental data for your location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Thermometer className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Temperature</p>
                <p className="text-2xl font-bold">{result.weather?.temperature || 'N/A'}°C</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Droplets className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Humidity</p>
                <p className="text-2xl font-bold">{result.weather?.humidity || 'N/A'}%</p>
              </div>
              {result.weather?.description && (
                <div className="text-center p-4 bg-muted/50 rounded-lg col-span-2">
                  <Cloud className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Conditions</p>
                  <p className="text-lg font-semibold capitalize">{result.weather.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Soil Parameters</CardTitle>
              <CardDescription>Your current soil composition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Nitrogen (N)</span>
                <span className="font-semibold">{result.soil?.nitrogen || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Phosphorus (P)</span>
                <span className="font-semibold">{result.soil?.phosphorus || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Potassium (K)</span>
                <span className="font-semibold">{result.soil?.potassium || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>pH Level</span>
                <span className="font-semibold">{result.soil?.ph || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Rainfall</span>
                <span className="font-semibold">{result.soil?.rainfall ? `${result.soil.rainfall} mm` : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Fertilizer Recommendations
              </CardTitle>
              <CardDescription>Optimize your soil nutrition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.fertilizer ? (
                result.fertilizer.map((rec: any, idx: number) => (
                  <div key={idx} className="border-l-4 pl-3 py-2" style={{
                    borderColor: rec.color === 'red' ? 'hsl(var(--destructive))' : 
                                rec.color === 'yellow' ? 'hsl(var(--warning))' : 
                                'hsl(var(--primary))'
                  }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{rec.nutrient}</span>
                      <Badge variant={rec.color === 'green' ? 'default' : 'secondary'}>
                        {rec.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.recommendation}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No specific fertilizer recommendations available.</p>
              )}
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
