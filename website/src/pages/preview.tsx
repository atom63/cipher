import DefaultLayout from "@/components/common/layout/default-layout";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  BarChart3,
  CircleAlert,
  Copy,
  FileCode,
  FileText,
  FolderOpen,
  Info,
  MoreHorizontal,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings,
  TriangleAlert,
  Undo2,
  Upload,
} from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

const colorSwatches = [
  { name: "background", var: "var(--background)" },
  { name: "foreground", var: "var(--foreground)" },
  { name: "primary", var: "var(--primary)" },
  { name: "secondary", var: "var(--secondary)" },
  { name: "muted", var: "var(--muted)" },
  { name: "accent", var: "var(--accent)" },
  { name: "destructive", var: "var(--destructive)" },
  { name: "chart-1", var: "var(--chart-1)" },
  { name: "chart-2", var: "var(--chart-2)" },
  { name: "chart-3", var: "var(--chart-3)" },
  { name: "chart-4", var: "var(--chart-4)" },
  { name: "chart-5", var: "var(--chart-5)" },
];

const trafficData = [
  { month: "Jan", desktop: 180, mobile: 120 },
  { month: "Feb", desktop: 210, mobile: 140 },
  { month: "Mar", desktop: 190, mobile: 160 },
  { month: "Apr", desktop: 220, mobile: 180 },
  { month: "May", desktop: 200, mobile: 150 },
  { month: "Jun", desktop: 224, mobile: 136 },
];

const frequencyData = [
  { band: "60", value: 45 },
  { band: "250", value: 72 },
  { band: "500", value: 58 },
  { band: "1k", value: 85 },
  { band: "2k", value: 62 },
  { band: "4k", value: 78 },
  { band: "8k", value: 55 },
  { band: "16k", value: 40 },
];

const trafficChartConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

const frequencyChartConfig = {
  value: { label: "Level", color: "var(--chart-1)" },
} satisfies ChartConfig;

function Toolbar() {
  const icons = [
    FileText,
    FolderOpen,
    Undo2,
    RefreshCw,
    Save,
    Upload,
    MoreHorizontal,
    RefreshCw,
    Search,
    Settings,
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card px-2 py-2">
      {icons.map((Icon, i) => (
        <button
          key={i}
          type="button"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label={`Tool ${i + 1}`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

export default function Preview() {
  usePageMeta({
    title: "UI Review",
    description: "Design system component preview and token showcase.",
  });

  return (
    <DefaultLayout>
        <Section>
      <Container maxWidth="default" padding="all">
          

        <div className="columns-1 gap-6 sm:columns-2 md:columns-3 [&>*]:break-inside-avoid [&>*]:mb-6 [&>*:last-child]:mb-0">
          {/* Typography & color swatches */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Title 
                </CardTitle>
                <CardDescription>
                  Designers love packing quirky glyphs into test phrases. This is
                  a preview of the typography and color palette.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {colorSwatches.map((swatch) => (
                    <div key={swatch.name} className="flex flex-col gap-1">
                      <div
                        className="aspect-4/3 w-full rounded-md border"
                        style={{ backgroundColor: swatch.var }}
                      />
                      <span className="truncate text-xs text-muted-foreground">
                        --{swatch.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Codespaces */}
          <div>
            <Card>
              <Tabs defaultValue="codespaces">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <TabsList variant="default">
                      <TabsTrigger value="codespaces">Codespaces</TabsTrigger>
                      <TabsTrigger value="local">Local</TabsTrigger>
                    </TabsList>
                  </div>
                  <CardTitle>Codespaces</CardTitle>
                  <CardDescription>
                    Your workspaces in the cloud
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TabsContent value="codespaces">
                    <EmptyState
                      icon={<Server className="size-5" />}
                      title="No codespaces"
                      description="You don't have any codespaces with this repository checked out"
                      action={
                        <Button>Create Codespace</Button>
                      }
                    />
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      Codespace usage for this repository is paid for by shaden.
                    </p>
                  </TabsContent>
                  <TabsContent value="local">
                    <EmptyState
                      icon={<FolderOpen className="size-5" />}
                      title="No local workspaces"
                      description="Connect a local folder to get started"
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Audio frequency visualizer */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Audio Frequency Visualizer</CardTitle>
                <CardDescription>
                  Real-time frequency band visualization with animated state
                  transitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={frequencyChartConfig}
                  className="h-[140px] w-full"
                >
                  <BarChart data={frequencyData} layout="vertical" margin={{ left: 0, right: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="band"
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      fill="var(--color-value)"
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>
                  Informational, warning, and destructive alert variants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert variant="info">
                  <Info className="size-4" />
                  <AlertTitle>Info</AlertTitle>
                  <AlertDescription>
                    Your session will expire in 5 minutes. Refresh to stay
                    signed in.
                  </AlertDescription>
                  <AlertAction>
                    <Button variant="outline" size="sm">
                      Refresh
                    </Button>
                  </AlertAction>
                </Alert>
                <Alert variant="warning">
                  <TriangleAlert className="size-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Storage is 85% full. Consider upgrading your plan.
                  </AlertDescription>
                  <AlertAction>
                    <Button variant="outline" size="sm">
                      Upgrade
                    </Button>
                  </AlertAction>
                </Alert>
                <Alert variant="destructive">
                  <CircleAlert className="size-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to save changes. Please try again.
                  </AlertDescription>
                  <AlertAction>
                    <Button variant="destructive" size="sm">
                      Retry
                    </Button>
                  </AlertAction>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Accordion */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
                <CardDescription>
                  Collapsible accordion for frequently asked questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="1">
                    <AccordionTrigger>
                      How do I export my design tokens?
                    </AccordionTrigger>
                    <AccordionContent>
                      Use the Export page to generate CSS, JSON, or Tailwind
                      config. Select your tokens and choose the output format.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="2">
                    <AccordionTrigger>
                      Can I use Cipher with Tailwind v4?
                    </AccordionTrigger>
                    <AccordionContent>
                      Yes, Cipher exports tokens compatible with Tailwind CSS v4
                      and modern CSS variable workflows.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="3">
                    <AccordionTrigger>
                      Is my data stored in the cloud?
                    </AccordionTrigger>
                    <AccordionContent>
                      No. Cipher is local-first. All token data stays in your
                      Figma file and local export files.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar */}
          <div>
            <Toolbar />
          </div>

          {/* Environment variables */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>Production · 8 variables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="db-url">DATABASE_URL</Label>
                  <Input
                    id="db-url"
                    type="password"
                    defaultValue="••••••••••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-url">NEXT_PUBLIC_API</Label>
                  <Input
                    id="api-url"
                    type="text"
                    defaultValue="https://api.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe">STRIPE_SECRET</Label>
                  <Input
                    id="stripe"
                    type="password"
                    defaultValue="••••••••••••••••"
                  />
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline">Edit</Button>
                <Button>Deploy</Button>
              </CardFooter>
            </Card>
          </div>

          {/* UI components showcase */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Components</CardTitle>
                <CardDescription>Button, toggle, input, badge, and form controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Button>Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="destructive">Delete</Button>
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor="2fa" className="flex items-center gap-2">
                    Two-factor authentication
                    <Switch id="2fa" defaultChecked />
                  </Label>
                </div>
                <div className="space-y-2">
                  <InputGroup>
                    <InputGroupInput placeholder="Name" />
                    <InputGroupAddon align="inline-end">
                      <Search className="size-4" />
                    </InputGroupAddon>
                  </InputGroup>
                  <InputGroup>
                    <InputGroupTextarea placeholder="Message" />
                  </InputGroup>
                </div>
                <FieldGroup className="max-w-sm">
                  <Field>
                    <FieldLabel htmlFor="block-start-input">Block start</FieldLabel>
                    <InputGroup className="h-auto">
                      <InputGroupInput
                        id="block-start-input"
                        placeholder="Enter your name"
                      />
                      <InputGroupAddon align="block-start">
                        <InputGroupText>Full Name</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Header positioned above the input.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="block-start-textarea">Textarea</FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        id="block-start-textarea"
                        placeholder="console.log('Hello, world!');"
                        className="font-mono text-sm"
                      />
                      <InputGroupAddon align="block-start">
                        <FileCode className="size-4 text-muted-foreground" />
                        <InputGroupText className="font-mono">script.js</InputGroupText>
                        <InputGroupButton size="icon-xs" className="ml-auto">
                          <Copy className="size-4" />
                          <span className="sr-only">Copy</span>
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Header positioned above the textarea.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <div className="flex flex-wrap gap-2">
                  <Badge>Badge</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
                <div className="flex items-center gap-6">
                  <RadioGroup defaultValue="a" className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="a" id="r1" />
                      <Label htmlFor="r1">Option A</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="b" id="r2" />
                      <Label htmlFor="r2">Option B</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="c" id="r3" />
                      <Label htmlFor="r3">Option C</Label>
                    </div>
                  </RadioGroup>
                  <div className="flex items-center gap-2">
                    <Checkbox id="cb" />
                    <Label htmlFor="cb">Checkbox</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Traffic channels */}
          <div>
            <Card>
              <CardHeader>
                <Tabs defaultValue="6m">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Traffic Channels</CardTitle>
                      <CardDescription>
                        Desktop vs mobile over the last 6 months
                      </CardDescription>
                    </div>
                    <TabsList variant="default">
                      <TabsTrigger value="6m">6M</TabsTrigger>
                      <TabsTrigger value="12m">12M</TabsTrigger>
                    </TabsList>
                  </div>
                </Tabs>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={trafficChartConfig}
                  className="h-[200px] w-full"
                >
                  <BarChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="desktop"
                      stackId="a"
                      fill="var(--color-desktop)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="mobile"
                      stackId="a"
                      fill="var(--color-mobile)"
                      radius={[0, 0, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
                <div className="mt-4 flex gap-6 text-sm">
                  <span className="font-mono font-medium">DESKTOP 1,224</span>
                  <span className="font-mono font-medium">MOBILE 860</span>
                  <span className="font-mono font-medium text-muted-foreground">
                    MIX DELTA +42%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Observability */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-2">
                    <CardTitle>Observability Plus is replacing Monitoring</CardTitle>
                    <CardDescription>
                      Switch to the improved way to explore your data, with
                      natural language. Monitoring will no longer be available on
                      the Pro plan in November, 2025.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Warning</Badge>
                </div>
              </CardHeader>
              <CardFooter>
                <Button>
                  <BarChart3 className="size-4" />
                  Create Query +
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Invite team */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Invite Team</CardTitle>
                <CardDescription>Add members to your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      id="invite-1"
                      placeholder="alex@example.com"
                      className="flex-1"
                    />
                    <Select defaultValue="editor">
                      <SelectTrigger className="h-8 w-[110px] shrink-0" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      id="invite-2"
                      placeholder="sam@example.com"
                      className="flex-1"
                    />
                    <Select defaultValue="viewer">
                      <SelectTrigger className="h-8 w-[110px] shrink-0" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  + Add another
                </Button>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">
                    Or share invite link
                  </Label>
                  <InputGroup>
                    <InputGroupInput
                      readOnly
                      defaultValue="https://app.co/invite/x8f2k"
                      className="text-muted-foreground"
                    />
                    <InputGroupAddon align="inline-end">
                      <Button variant="ghost" size="icon-xs">
                        <Copy className="size-4" />
                        <span className="sr-only">Copy link</span>
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats cards */}
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="p-0">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Active users
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">2,847</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              <Card className="p-0">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Revenue
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">$24.2k</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>
              <Card className="p-0">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Conversion
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">3.2%</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    -0.4% from last month
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Team members with avatars */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Avatar group and user cards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AvatarGroup>
                  <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>AK</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>SM</AvatarFallback>
                  </Avatar>
                  <AvatarGroupCount>+5</AvatarGroupCount>
                </AvatarGroup>
                <Separator />
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Jordan Davis</p>
                    <p className="text-sm text-muted-foreground truncate">
                      jordan@example.com
                    </p>
                  </div>
                  <Badge variant="secondary">Admin</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>AK</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Alex Kim</p>
                    <p className="text-sm text-muted-foreground truncate">
                      alex@example.com
                    </p>
                  </div>
                  <Badge variant="outline">Editor</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress & Slider */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Progress & Slider</CardTitle>
                <CardDescription>
                  Progress bars and range sliders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Storage used</Label>
                    <span className="text-muted-foreground">68%</span>
                  </div>
                  <Progress value={68} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Volume</Label>
                    <span className="text-muted-foreground">75</span>
                  </div>
                  <Slider defaultValue={[75]} max={100} step={1} />
                </div>
                <div className="space-y-2">
                  <Label>Brightness</Label>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skeleton loading */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Skeleton</CardTitle>
                <CardDescription>
                  Loading placeholder states
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </Container>
        </Section>
    </DefaultLayout>
  );
}
