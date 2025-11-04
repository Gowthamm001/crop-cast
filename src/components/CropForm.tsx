import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, CloudRain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const CropForm = () => {
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");
  const [ph, setPh] = useState("");
  const [rainfall, setRainfall] = useState("");
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getLocation = () => {
    setFetchingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(loc);
          localStorage.setItem("lastLocation", JSON.stringify(loc));
          toast({ title: "Location found!", description: "GPS coordinates captured" });
          setFetchingLocation(false);
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not get location. Using cached data if available.",
            variant: "destructive",
          });
          const cached = localStorage.getItem("lastLocation");
          if (cached) setLocation(JSON.parse(cached));
          setFetchingLocation(false);
        }
      );
    } else {
      toast({
        title: "GPS not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      setFetchingLocation(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem("lastLocation");
    if (cached) setLocation(JSON.parse(cached));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      toast({
        title: "Location required",
        description: "Please fetch your location first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: weatherData, error: weatherError } = await supabase.functions.invoke("get-weather", {
        body: { lat: location.lat, lon: location.lon },
      });

      if (weatherError) throw weatherError;

      const { data: predictionData, error: predictionError } = await supabase.functions.invoke("predict-crop", {
        body: {
          nitrogen: parseFloat(nitrogen),
          phosphorus: parseFloat(phosphorus),
          potassium: parseFloat(potassium),
          ph: parseFloat(ph),
          rainfall: parseFloat(rainfall),
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
        },
      });

      if (predictionError) throw predictionError;

      const result = {
        crop: predictionData.crop,
        confidence: predictionData.confidence,
        weather: weatherData,
        soil: { nitrogen, phosphorus, potassium, ph, rainfall },
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("lastPrediction", JSON.stringify(result));
      navigate("/result", { state: result });
    } catch (error: any) {
      const cached = localStorage.getItem("lastPrediction");
      if (cached) {
        toast({
          title: "Using offline data",
          description: "Showing your last prediction",
        });
        navigate("/result", { state: JSON.parse(cached) });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to get prediction",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Soil Data Input</CardTitle>
        <CardDescription>Enter your soil parameters for crop recommendation</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nitrogen">Nitrogen (N)</Label>
              <Input
                id="nitrogen"
                type="number"
                step="0.01"
                value={nitrogen}
                onChange={(e) => setNitrogen(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phosphorus">Phosphorus (P)</Label>
              <Input
                id="phosphorus"
                type="number"
                step="0.01"
                value={phosphorus}
                onChange={(e) => setPhosphorus(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="potassium">Potassium (K)</Label>
              <Input
                id="potassium"
                type="number"
                step="0.01"
                value={potassium}
                onChange={(e) => setPotassium(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ph">pH Level</Label>
              <Input
                id="ph"
                type="number"
                step="0.01"
                min="0"
                max="14"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rainfall">Rainfall (mm)</Label>
              <Input
                id="rainfall"
                type="number"
                step="0.01"
                value={rainfall}
                onChange={(e) => setRainfall(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm">
                {location
                  ? `Location: ${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`
                  : "No location set"}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={getLocation}
              disabled={fetchingLocation}
            >
              {fetchingLocation ? "Fetching..." : "Get Location"}
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !location}>
            {loading ? "Analyzing..." : "Get Recommendation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
