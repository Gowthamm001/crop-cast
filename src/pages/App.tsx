import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CropForm } from "@/components/CropForm";
import { CropImageAnalyzer } from "@/components/CropImageAnalyzer";
import { VoiceControl } from "@/components/VoiceControl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, LogOut, Sprout } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const AppPage = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/");
      } else {
        setUser(user);
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleVoiceInput = (text: string) => {
    toast({
      title: t("voiceControl"),
      description: text,
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Ai Based Crop Recommandation For Farmers</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <VoiceControl onVoiceInput={handleVoiceInput} />
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
              <History className="h-4 w-4 mr-2" />
              {t("history")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="soil" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="soil">Soil Analysis</TabsTrigger>
            <TabsTrigger value="image">Image Detection</TabsTrigger>
          </TabsList>
          <TabsContent value="soil" className="flex justify-center">
            <CropForm />
          </TabsContent>
          <TabsContent value="image" className="flex justify-center">
            <CropImageAnalyzer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AppPage;
