import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const cropSchema = z.object({
  nitrogen: z.number().min(0, "Must be at least 0").max(1000, "Must be at most 1000"),
  phosphorus: z.number().min(0, "Must be at least 0").max(1000, "Must be at most 1000"),
  potassium: z.number().min(0, "Must be at least 0").max(1000, "Must be at most 1000"),
  ph: z.number().min(0, "Must be at least 0").max(14, "Must be at most 14"),
  rainfall: z.number().min(0, "Must be at least 0").max(1000, "Must be at most 1000"),
});

export const CropForm = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof cropSchema>>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      ph: 7,
      rainfall: 0,
    },
  });

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

  const handleSubmit = async (values: z.infer<typeof cropSchema>) => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please get your location first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: weatherData, error: weatherError } = await supabase.functions.invoke(
        "get-weather",
        {
          body: { lat: location.lat, lon: location.lon },
        }
      );

      if (weatherError) throw weatherError;

      const { data: predictionData, error: predictionError } = await supabase.functions.invoke(
        "predict-crop",
        {
          body: {
            nitrogen: values.nitrogen,
            phosphorus: values.phosphorus,
            potassium: values.potassium,
            ph: values.ph,
            rainfall: values.rainfall,
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
          },
        }
      );

      if (predictionError) throw predictionError;

      const result = {
        ...predictionData,
        weather: {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
        },
        soil: {
          nitrogen: values.nitrogen.toString(),
          phosphorus: values.phosphorus.toString(),
          potassium: values.potassium.toString(),
          ph: values.ph.toString(),
          rainfall: values.rainfall.toString(),
        },
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("lastPrediction", JSON.stringify(result));

      navigate("/result", { state: { result } });
    } catch (error: any) {
      const cachedPrediction = localStorage.getItem("lastPrediction");
      if (cachedPrediction) {
        try {
          const result = JSON.parse(cachedPrediction);
          navigate("/result", { 
            state: { 
              result,
              error: "Using cached prediction due to connection error" 
            }
          });
          return;
        } catch (e) {
          console.error("Failed to parse cached prediction");
        }
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to get prediction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t("soilDataInput")}</CardTitle>
        <CardDescription>{t("soilDataDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nitrogen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nitrogen")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phosphorus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phosphorus")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="potassium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("potassium")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phLevel")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 7)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rainfall"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("rainfall")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {location
                    ? `${t("location")}: ${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`
                    : t("noLocation")}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={getLocation}
                disabled={fetchingLocation}
              >
                {fetchingLocation ? t("fetching") : t("getLocation")}
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !location}>
              {loading ? t("analyzing") : t("getRecommendation")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
