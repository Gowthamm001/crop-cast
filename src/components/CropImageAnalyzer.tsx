import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export const CropImageAnalyzer = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Image must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    const validFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      toast({
        title: "Invalid image format",
        description: "Please upload JPG, PNG, GIF, or WebP images only",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      setImagePreview(base64Image);
      setAnalyzing(true);

      try {
        const { data, error } = await supabase.functions.invoke('analyze-crop-image', {
          body: { imageBase64: base64Image },
        });

        if (error) throw error;

        setAnalysis(data.analysis);
        toast({
          title: "Analysis complete",
          description: "Crop image has been analyzed",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to analyze image",
          variant: "destructive",
        });
      } finally {
        setAnalyzing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {t("uploadImage")}
        </CardTitle>
        <CardDescription>Upload a crop image for AI analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={analyzing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {t("uploadImage")}
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          />
        </div>

        {imagePreview && (
          <div className="rounded-lg overflow-hidden border">
            <img src={imagePreview} alt="Crop preview" className="w-full h-auto" />
          </div>
        )}

        {analyzing && (
          <div className="text-center text-muted-foreground">
            {t("analyzing")}
          </div>
        )}

        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("imageAnalysis")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{analysis}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
