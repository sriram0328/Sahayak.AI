
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookText,
  BotMessageSquare,
  FileImage,
  HelpCircle,
  Home,
  LayoutGrid,
  ListTodo,
  MessageSquarePlus,
  Mic,
  MicOff,
  Puzzle,
  Sparkles,
  Drama,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/hyperlocal-content", label: "Story Creator", icon: BookText },
  { href: "/differentiated-worksheets", label: "Worksheets", icon: LayoutGrid },
  { href: "/knowledge-assistant", label: "Knowledge Assistant", icon: BotMessageSquare },
  { href: "/ask-later", label: "Ask Later", icon: MessageSquarePlus },
  { href: "/visual-aid", label: "Visual Aids", icon: FileImage },
  { href: "/lesson-planner", label: "Lesson Planner", icon: ListTodo },
  { href: "/role-play-script", label: "Role-Play Scripts", icon: Drama },
  { href: "/gamified-learning", label: "Learning Games", icon: Puzzle },
];

const featureRoutes: { [key: string]: string } = {
  dashboard: "/",
  "story creator": "/hyperlocal-content",
  story: "/hyperlocal-content",
  worksheets: "/differentiated-worksheets",
  "differentiated worksheets": "/differentiated-worksheets",
  "knowledge assistant": "/knowledge-assistant",
  assistant: "/knowledge-assistant",
  "ask later": "/ask-later",
  "visual aids": "/visual-aid",
  visuals: "/visual-aid",
  "lesson planner": "/lesson-planner",
  planner: "/lesson-planner",
  "role play script": "/role-play-script",
  "role play": "/role-play-script",
  script: "/role-play-script",
  "learning games": "/gamified-learning",
  games: "/gamified-learning",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  const handleCommand = useCallback((command: string) => {
    if (!command) return;

    const lowerCaseCommand = command.toLowerCase().trim();

    toast({
      title: "Processing Command...",
      description: `I heard: "${command}"`,
      duration: 2000,
    });

    let targetRoute: string | null = null;
    let matchedFeature: string | null = null;

    for (const featureName of Object.keys(featureRoutes)) {
      if (lowerCaseCommand.includes(featureName)) {
        if (!matchedFeature || featureName.length > matchedFeature.length) {
          targetRoute = featureRoutes[featureName];
          matchedFeature = featureName;
        }
      }
    }

    if (targetRoute) {
      router.push(targetRoute);
    } else {
      toast({
        variant: "destructive",
        title: "Unknown Command",
        description: `I didn't recognize a feature in your command. Try "Open worksheets".`,
      });
    }
  }, [router, toast]);

  const { isListening, startListening, stopListening, hasRecognitionSupport } = useSpeechToText({
    onCommand: handleCommand,
  });


  const handleGlobalListenClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tighter font-headline">
              Sahayak.AI
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                  }
                  tooltip={{
                    children: item.label,
                    side: "right",
                  }}
                >
                  <Link href={item.href}>
                    <>
                      <item.icon />
                      <span>{item.label}</span>
                    </>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            {pathname !== "/" && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </>
                </Link>
              </Button>
            )}
          </div>
          {clientReady && hasRecognitionSupport && (
            <div className="flex items-center gap-2">
              {isListening && <p className="text-sm text-muted-foreground animate-pulse">Listening...</p>}
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={handleGlobalListenClick}
                title="Activate Voice Commands"
              >
                {isListening ? <MicOff /> : <Mic />}
                <span className="sr-only">
                  {isListening ? "Stop listening" : "Start listening"}
                </span>
              </Button>
            </div>
          )}
        </header>
        <main className="flex-1 p-6 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
