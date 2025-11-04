import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sprout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const History = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("crop_predictions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPredictions(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Button variant="ghost" onClick={() => navigate("/app")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Prediction History</CardTitle>
            <CardDescription>Your past crop recommendations</CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : predictions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No predictions yet</p>
              <Button onClick={() => navigate("/app")}>Make Your First Prediction</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <Card key={prediction.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Sprout className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-bold text-lg">{prediction.predicted_crop}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(prediction.created_at).toLocaleDateString()} at{" "}
                          {new Date(prediction.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p>
                        <span className="font-semibold">N:</span> {prediction.nitrogen},{" "}
                        <span className="font-semibold">P:</span> {prediction.phosphorus},{" "}
                        <span className="font-semibold">K:</span> {prediction.potassium}
                      </p>
                      <p>
                        <span className="font-semibold">pH:</span> {prediction.ph_value},{" "}
                        <span className="font-semibold">Temp:</span> {prediction.temperature}°C
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
