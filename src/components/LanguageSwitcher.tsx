import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Languages className="h-4 w-4 mr-2" />
          {language === "en" ? "English" : "తెలుగు"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setLanguage("en")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("te")}>
          తెలుగు (Telugu)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
