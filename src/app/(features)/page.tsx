
import Link from 'next/link';
import {
  ArrowRight,
  BookText,
  BotMessageSquare,
  FileImage,
  HelpCircle,
  LayoutGrid,
  ListTodo,
  MessageSquarePlus,
  Puzzle,
  Hourglass,
  Drama,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const features = [
  {
    title: 'Story Creator',
    description: 'Generate culturally relevant stories in local languages.',
    href: '/hyperlocal-content',
    icon: <BookText className="w-8 h-8 text-primary" />,
    cta: 'Create Story',
  },
  {
    title: 'Differentiated Worksheets',
    description: 'Create worksheets for all skill levels from a textbook photo.',
    href: '/differentiated-worksheets',
    icon: <LayoutGrid className="w-8 h-8 text-primary" />,
    cta: 'Generate Worksheets',
  },
  {
    title: 'Knowledge Assistant',
    description: 'Get simple answers to complex questions with analogies.',
    href: '/knowledge-assistant',
    icon: <BotMessageSquare className="w-8 h-8 text-primary" />,
    cta: 'Ask a Question',
  },
  {
    title: 'Ask Later',
    description: 'Capture student questions and get AI answers later.',
    href: '/ask-later',
    icon: <MessageSquarePlus className="w-8 h-8 text-primary" />,
    cta: 'Open Queue',
  },
  {
    title: 'Visual Aids',
    description: 'Generate AI sketches or search the web for images.',
    href: '/visual-aid',
    icon: <FileImage className="w-8 h-8 text-primary" />,
    cta: 'Create Visuals',
  },
  {
    title: 'Lesson Planner',
    description: 'Automatically create weekly lesson plans from your syllabus.',
    href: '/lesson-planner',
    icon: <ListTodo className="w-8 h-8 text-primary" />,
    cta: 'Plan Lessons',
  },
  {
    title: 'Role-Play Scripts',
    description: 'Create educational role-play scripts for any scenario.',
    href: '/role-play-script',
    icon: <Drama className="w-8 h-8 text-primary" />,
    cta: 'Create Scripts',
  },
  {
    title: 'Learning Games',
    description: 'Engage students with interactive quizzes, puzzles, and games.',
    href: '/gamified-learning',
    icon: <Puzzle className="w-8 h-8 text-primary" />,
    cta: 'Play Games',
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tighter font-headline md:text-4xl">
          Welcome, I'm Sahayak.AI!
        </h1>
        <p className="text-muted-foreground">
          Your AI co-teacher is ready to help. Select a tool or use the microphone to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
            <CardHeader className="flex flex-row items-start gap-4">
                {feature.icon}
                <div className="grid gap-1">
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                </div>
            </CardHeader>
            <CardFooter className="flex items-end justify-end flex-grow mt-auto">
              <Button asChild variant="ghost" className="text-primary hover:text-primary">
                <Link href={feature.href}>
                  <>
                    {feature.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
         <Card className="flex flex-col transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg bg-secondary/50">
            <CardHeader className="flex flex-row items-start gap-4">
                <Hourglass className="w-8 h-8 text-muted-foreground" />
                <div className="grid gap-1">
                    <CardTitle className="font-headline text-muted-foreground">More Features Coming Soon</CardTitle>
                    <CardDescription>We're always working on new tools to empower teachers. Stay tuned for exciting updates!</CardDescription>
                </div>
            </CardHeader>
             <CardFooter className="flex items-end justify-end flex-grow mt-auto">
              <Button variant="ghost" disabled>
                  Stay Tuned
              </Button>
            </CardFooter>
          </Card>
      </div>
    </div>
  );
}
