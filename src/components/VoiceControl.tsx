import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface VoiceControlProps {
  onVoiceInput: (text: string) => void;
}

export const VoiceControl = ({ onVoiceInput }: VoiceControlProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language === 'te' ? 'te-IN' : 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onVoiceInput(transcript);
        toast({
          title: "Voice input received",
          description: transcript,
        });
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Voice input error",
          description: "Failed to recognize speech",
          variant: "destructive",
        });
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [language, onVoiceInput, toast]);

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now",
      });
    }
  };

  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="sm"
      onClick={toggleListening}
      className="gap-2"
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      {isListening ? t("stopListening") : t("startListening")}
    </Button>
  );
};
