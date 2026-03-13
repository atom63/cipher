import {
  Anchor,
  Bike,
  Bird,
  BookOpen,
  Brush,
  Camera,
  Cloud,
  Code,
  Coffee,
  Compass,
  Cookie,
  Cpu,
  Drama,
  Ear,
  Figma,
  Film,
  Flame,
  Gamepad2,
  Gem,
  Globe,
  Headphones,
  Heart,
  Landmark,
  Layers,
  Leaf,
  MapPin,
  Mic,
  Monitor,
  Mountain,
  Music,
  Paintbrush,
  Palette,
  Pen,
  Piano,
  Puzzle,
  Rocket,
  Sailboat,
  Scissors,
  Shell,
  Sparkles,
  SunMedium,
  Telescope,
  Timer,
  TreePine,
  Waves,
  Wind,
  Wine,
  Wrench,
  Zap,
} from "lucide-react";

import type { ComponentType } from "react";
import type {
  PosterLayout,
  PosterPage,
  PosterPattern,
} from "@/components/eazo/poster";
import {
  CATEGORY_ICONS,
  type IconComponent,
} from "@/components/eazo/poster-icon";
import type { Category } from "./cards";

export interface MockCard {
  category: Category;
  description: string;
  posterIcon?: IconComponent;
  posterLabel: string;
  posterLayout?: PosterLayout;
  posterPages?: PosterPage[];
  posterPattern?: PosterPattern;
  posterTitle: string;
  subtitle: { icon: ComponentType<{ className?: string }>; text: string };
  tags: string[];
  thumbnail: string;
  title: string;
}

export const mockCards: MockCard[] = [
  {
    category: "trending",
    title: "Designing for Delight",
    description:
      "How micro-interactions and thoughtful animations can transform a mundane interface into something users genuinely enjoy using every day.",
    posterTitle: "Make It Feel Alive",
    posterLabel: "Essay",
    posterLayout: "default",
    posterPattern: "dots",
    subtitle: { icon: Sparkles, text: "Design Systems" },
    tags: ["#ux", "#animation", "#microinteractions", "#delight", "#craft"],
    thumbnail:
      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80",
  },
  {
    category: "tech",
    title: "The Art of Code Review",
    description:
      "A practical guide to giving feedback that helps your team grow — without the ego, gatekeeping, or nitpicking that makes PRs painful.",
    posterTitle: "Better Feedback, Better Code",
    posterLabel: "Guide",
    posterLayout: "centered",
    posterPattern: "grid",
    subtitle: { icon: Code, text: "Engineering Culture" },
    tags: ["#codereview", "#teamwork", "#engineering", "#culture"],
    thumbnail:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
  },
  {
    category: "travel",
    title: "Mountain Light",
    description:
      "Chasing golden hour across the Alps — a photo essay on patience, elevation, and the fleeting moments that make landscape photography worth the hike.",
    posterTitle: "Chase the Golden Hour",
    posterLabel: "Photo Essay",
    posterPages: [
      {
        title: "Chase the Golden Hour",
        label: "Photo Essay",
        description:
          "Chasing golden hour across the Alps — patience, elevation, and fleeting moments.",
        layout: "default",
      },
      {
        title: "The Waiting Game",
        label: "Part Two",
        description:
          "Why the best landscape shots require hours of stillness and a willingness to return empty-handed.",
        layout: "editorial",
      },
    ],
    subtitle: { icon: Camera, text: "Photography" },
    tags: ["#photography", "#landscape", "#mountains", "#goldenhour"],
    thumbnail:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  },
  {
    category: "tech",
    title: "Building a Design Token Pipeline",
    description:
      "From Figma variables to production CSS — how we automated our entire design-to-code handoff with a single source of truth.",
    posterTitle: "One Source of Truth",
    posterLabel: "Case Study",
    posterLayout: "editorial",
    posterPattern: "dots",
    subtitle: { icon: Figma, text: "Design Ops" },
    tags: ["#designtokens", "#figma", "#automation", "#css", "#pipeline"],
    thumbnail:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
  },
  {
    category: "tech",
    title: "Sound Design for Interfaces",
    description:
      "Why the next frontier of UX isn't visual — exploring how subtle audio cues can reduce cognitive load and create spatial awareness in digital products.",
    posterTitle: "Listen to Your UI",
    posterLabel: "Research",
    posterLayout: "minimal",
    subtitle: { icon: Headphones, text: "Audio UX" },
    tags: ["#sounddesign", "#ux", "#accessibility", "#audio"],
    thumbnail:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
  },
  {
    category: "career",
    title: "Startup Velocity",
    description:
      "Lessons from shipping a product in 30 days — what to cut, what to keep, and why speed compounds faster than perfection.",
    posterTitle: "Ship It in 30 Days",
    posterLabel: "Playbook",
    posterPattern: "grid",
    posterPages: [
      {
        title: "Ship It in 30 Days",
        label: "Playbook",
        description:
          "What to cut, what to keep, and why speed compounds faster than perfection.",
        layout: "centered",
      },
      {
        title: "The Ruthless Backlog",
        label: "Chapter Two",
        description:
          "How saying no to 90% of ideas is the only way to ship the 10% that matters.",
        layout: "minimal",
      },
    ],
    subtitle: { icon: Rocket, text: "Startups" },
    tags: ["#startup", "#shipping", "#mvp", "#velocity", "#product"],
    thumbnail:
      "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",
  },
  {
    category: "beauty",
    title: "Color Theory in Practice",
    description:
      "Moving beyond the color wheel — how to build palettes that work across light mode, dark mode, and everything in between.",
    posterTitle: "Beyond the Color Wheel",
    posterLabel: "Tutorial",
    posterLayout: "top",
    subtitle: { icon: Palette, text: "Visual Design" },
    tags: ["#color", "#darkmode", "#design", "#accessibility"],
    thumbnail:
      "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=800&q=80",
  },
  {
    category: "travel",
    title: "Remote Landscapes",
    description:
      "Documenting the world's most isolated places — from Iceland's highlands to Patagonia's glaciers, finding beauty in the unreachable.",
    posterTitle: "Beauty in the Unreachable",
    posterLabel: "Photo Essay",
    posterLayout: "centered",
    subtitle: { icon: Compass, text: "Travel" },
    tags: ["#travel", "#landscape", "#remote", "#adventure"],
    thumbnail:
      "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80",
  },
  {
    category: "tech",
    title: "The Monorepo Playbook",
    description:
      "How we migrated 47 packages into a single repository without breaking a single deploy — and why we'd do it again.",
    posterTitle: "47 Packages, One Repo",
    posterLabel: "Case Study",
    posterPattern: "dots",
    posterPages: [
      {
        title: "47 Packages, One Repo",
        label: "Case Study",
        description:
          "How we migrated everything into a single repository without breaking a single deploy.",
        layout: "default",
      },
      {
        title: "The Migration Playbook",
        label: "Part Two",
        description:
          "Step-by-step strategy for consolidating packages while keeping CI green.",
        layout: "top",
      },
      {
        title: "Life After Mono",
        label: "Part Three",
        description:
          "What changed after the migration — faster deploys, simpler reviews, and unexpected wins.",
        layout: "editorial",
      },
    ],
    subtitle: { icon: Layers, text: "Infrastructure" },
    tags: ["#monorepo", "#devops", "#tooling", "#architecture", "#dx"],
    thumbnail:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
  },
  {
    category: "beauty",
    title: "Street Typography",
    description:
      "A visual tour through Tokyo's signage — from neon kanji to hand-painted menus, every street corner is a masterclass in type.",
    posterTitle: "Type on Every Corner",
    posterLabel: "Visual Tour",
    posterLayout: "editorial",
    subtitle: { icon: Pen, text: "Typography" },
    tags: ["#typography", "#tokyo", "#signage", "#streetart"],
    thumbnail:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
  },
  {
    category: "tech",
    title: "Performance is a Feature",
    description:
      "Why your Lighthouse score matters less than your users' perceived speed — and practical techniques to make interfaces feel instant.",
    posterTitle: "Make It Feel Instant",
    posterLabel: "Deep Dive",
    posterLayout: "minimal",
    posterPattern: "grid",
    subtitle: { icon: Zap, text: "Web Performance" },
    tags: ["#performance", "#webdev", "#ux", "#optimization"],
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  },
  {
    category: "tech",
    title: "Podcast Studio Setup",
    description:
      "Building a professional recording space on a budget — the gear, acoustic treatment, and workflow that took our audio from amateur to broadcast-quality.",
    posterTitle: "Pro Audio on a Budget",
    posterLabel: "Guide",
    posterLayout: "top",
    subtitle: { icon: Mic, text: "Content Creation" },
    tags: ["#podcast", "#audio", "#studio", "#creator"],
    thumbnail:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
  },
  {
    category: "beauty",
    title: "Generative Art with Code",
    description:
      "Using noise functions, particle systems, and emergent algorithms to create art that surprises even its creator.",
    posterTitle: "Art That Surprises Its Creator",
    posterLabel: "Experiment",
    posterLayout: "centered",
    subtitle: { icon: Brush, text: "Creative Coding" },
    tags: ["#generativeart", "#creativecoding", "#algorithms", "#art", "#code"],
    thumbnail:
      "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800&q=80",
  },
  {
    category: "trending",
    title: "Local-First Software",
    description:
      "The case for putting data ownership back in users' hands — how CRDTs and sync engines are reshaping how we build apps.",
    posterTitle: "Own Your Data",
    posterLabel: "Manifesto",
    posterLayout: "editorial",
    posterPattern: "dots",
    subtitle: { icon: Monitor, text: "Architecture" },
    tags: ["#localfirst", "#crdt", "#sync", "#architecture"],
    thumbnail:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
  },
  {
    category: "travel",
    title: "Hidden Trails of Kyoto",
    description:
      "Beyond the tourist temples — discovering the moss-covered paths, forest shrines, and neighborhood gardens that locals keep to themselves.",
    posterTitle: "Off the Beaten Path",
    posterLabel: "Travel Log",
    posterLayout: "minimal",
    subtitle: { icon: MapPin, text: "Exploration" },
    tags: ["#kyoto", "#japan", "#travel", "#hidden", "#nature"],
    thumbnail:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
  },
  {
    category: "career",
    title: "Burnout Recovery",
    description:
      "What I learned from stepping away for three months — the warning signs I missed, the boundaries I now keep, and why rest is productive.",
    posterTitle: "Rest Is Productive",
    posterLabel: "Personal",
    posterLayout: "centered",
    subtitle: { icon: Flame, text: "Well-being" },
    tags: ["#burnout", "#mentalhealth", "#work", "#recovery"],
    thumbnail:
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80",
  },
  {
    category: "travel",
    title: "Alpine Dawn",
    description:
      "Waking up at 4 AM to catch first light hitting the Dolomites — a story about obsession, cold fingers, and the photographs that made it all worth it.",
    posterTitle: "First Light on the Dolomites",
    posterLabel: "Photo Essay",
    posterLayout: "top",
    subtitle: { icon: Mountain, text: "Adventure" },
    tags: ["#dolomites", "#sunrise", "#photography", "#alps"],
    thumbnail:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  },
  {
    category: "tech",
    title: "The Developer's Toolbox",
    description:
      "A curated list of CLI tools, browser extensions, and VS Code plugins that shaved hours off my weekly workflow.",
    posterTitle: "Sharpen Your Tools",
    posterLabel: "Resource",
    posterLayout: "editorial",
    subtitle: { icon: Wrench, text: "Productivity" },
    tags: ["#tools", "#cli", "#vscode", "#workflow", "#productivity"],
    thumbnail:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
  },
  {
    category: "sports",
    title: "Cycling Through Tuscany",
    description:
      "Two wheels, zero itinerary — a week of rolling through vineyards, hilltop villages, and roads that bend like cursive.",
    posterTitle: "Roads Like Cursive",
    posterLabel: "Travel Log",
    posterLayout: "minimal",
    subtitle: { icon: Bike, text: "Cycling" },
    tags: ["#cycling", "#tuscany", "#travel", "#slowtravel"],
    thumbnail:
      "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80",
  },
  {
    category: "tech",
    title: "Edge Computing Explained",
    description:
      "Moving computation closer to your users — why latency matters more than throughput and how edge functions are changing the game.",
    posterTitle: "Closer to the User",
    posterLabel: "Explainer",
    posterLayout: "top",
    subtitle: { icon: Cloud, text: "Cloud" },
    tags: ["#edge", "#serverless", "#latency", "#cloud"],
    thumbnail:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
  },
  {
    category: "food",
    title: "Sourdough Diaries",
    description:
      "A year of feeding a starter, burning loaves, and finally understanding the science behind the perfect crumb.",
    posterTitle: "The Perfect Crumb",
    posterLabel: "Personal",
    posterLayout: "centered",
    subtitle: { icon: Cookie, text: "Baking" },
    tags: ["#sourdough", "#baking", "#fermentation", "#craft"],
    thumbnail:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  },
  {
    category: "trending",
    title: "AI-Assisted Design Workflows",
    description:
      "How we integrated generative AI into our design pipeline without losing the human touch that makes products feel intentional.",
    posterTitle: "AI Meets Craft",
    posterLabel: "Case Study",
    posterLayout: "editorial",
    posterPattern: "grid",
    subtitle: { icon: Cpu, text: "AI & Design" },
    tags: ["#ai", "#design", "#workflow", "#generative", "#tools"],
    thumbnail:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  },
  {
    category: "beauty",
    title: "Cinematography for the Web",
    description:
      "Borrowing framing, pacing, and color grading techniques from film to make product videos that actually hold attention.",
    posterTitle: "Frame Every Pixel",
    posterLabel: "Tutorial",
    posterLayout: "minimal",
    subtitle: { icon: Film, text: "Video" },
    tags: ["#cinematography", "#video", "#colorgading", "#storytelling"],
    thumbnail:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80",
  },
  {
    category: "tech",
    title: "Indie Game Dev Log",
    description:
      "Six months building a puzzle platformer solo — the pixel art pipeline, the playtesting nightmares, and the joy of seeing strangers play your game.",
    posterTitle: "Built It Alone",
    posterLabel: "Dev Log",
    posterLayout: "top",
    subtitle: { icon: Gamepad2, text: "Game Dev" },
    tags: ["#gamedev", "#indie", "#pixelart", "#devlog"],
    thumbnail:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
  },
  {
    category: "tech",
    title: "Internationalization Done Right",
    description:
      "Beyond string translation — handling RTL layouts, plural rules, date formats, and the cultural nuances that make or break a global product.",
    posterTitle: "Think Global, Ship Local",
    posterLabel: "Guide",
    posterLayout: "centered",
    subtitle: { icon: Globe, text: "i18n" },
    tags: ["#i18n", "#localization", "#rtl", "#globalization"],
    thumbnail:
      "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80",
  },
  {
    category: "beauty",
    title: "Designing for Emotion",
    description:
      "Why the best products don't just work — they make people feel something. A framework for emotional design beyond usability.",
    posterTitle: "Feel Something",
    posterLabel: "Essay",
    posterLayout: "editorial",
    subtitle: { icon: Heart, text: "Emotional Design" },
    tags: ["#emotion", "#ux", "#psychology", "#design"],
    thumbnail:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80",
  },
  {
    category: "trending",
    title: "Sustainable Web Design",
    description:
      "Every byte has a carbon cost — how to build websites that are fast, accessible, and gentle on the planet.",
    posterTitle: "Every Byte Has a Cost",
    posterLabel: "Manifesto",
    posterLayout: "minimal",
    posterPattern: "grid",
    subtitle: { icon: Leaf, text: "Sustainability" },
    tags: ["#sustainability", "#greentech", "#performance", "#web"],
    thumbnail:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  },
  {
    category: "living",
    title: "Lo-fi Beats and Focus",
    description:
      "The science behind why ambient music helps you concentrate — and a curated playlist for deep work sessions.",
    posterTitle: "Sound of Deep Work",
    posterLabel: "Playlist",
    posterLayout: "top",
    subtitle: { icon: Music, text: "Focus" },
    tags: ["#lofi", "#focus", "#music", "#productivity"],
    thumbnail:
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800&q=80",
  },
  {
    category: "career",
    title: "Reading List: Systems Thinking",
    description:
      "Ten books that changed how I see complexity — from Donella Meadows to Nassim Taleb, a path through the landscape of systems.",
    posterTitle: "See the Whole System",
    posterLabel: "Book List",
    posterLayout: "centered",
    subtitle: { icon: BookOpen, text: "Reading" },
    tags: ["#books", "#systems", "#complexity", "#reading"],
    thumbnail:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80",
  },
  {
    category: "beauty",
    title: "Astrophotography Basics",
    description:
      "Your first Milky Way shot doesn't need a $5,000 setup — a beginner's guide to capturing the night sky with what you already own.",
    posterTitle: "Capture the Night Sky",
    posterLabel: "Tutorial",
    posterLayout: "editorial",
    subtitle: { icon: Telescope, text: "Astrophotography" },
    tags: ["#astrophotography", "#nightsky", "#milkyway", "#photography"],
    thumbnail:
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80",
  },
  {
    category: "living",
    title: "Cabin in the Pines",
    description:
      "A week offline in a forest cabin — what happens when you stop scrolling and start listening to the wind.",
    posterTitle: "Stop Scrolling, Start Listening",
    posterLabel: "Personal",
    posterLayout: "minimal",
    subtitle: { icon: TreePine, text: "Digital Detox" },
    tags: ["#offgrid", "#nature", "#detox", "#mindfulness"],
    thumbnail:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80",
  },
  {
    category: "travel",
    title: "Coastal Erosion Timelapse",
    description:
      "Five years of photographing the same cliff face — watching geology happen in real time as the sea reshapes the shoreline.",
    posterTitle: "The Sea Reshapes Everything",
    posterLabel: "Long-form",
    posterLayout: "top",
    subtitle: { icon: Waves, text: "Nature" },
    tags: ["#timelapse", "#erosion", "#geology", "#coastal"],
    thumbnail:
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80",
  },
  {
    category: "sports",
    title: "Paragliding Over Interlaken",
    description:
      "Stepping off a mountain into nothing but air — the terrifying, beautiful, addictive moment when gravity lets go.",
    posterTitle: "When Gravity Lets Go",
    posterLabel: "Adventure",
    posterLayout: "centered",
    subtitle: { icon: Wind, text: "Extreme Sports" },
    tags: ["#paragliding", "#switzerland", "#adventure", "#flying"],
    thumbnail:
      "https://images.unsplash.com/photo-1503435824048-a799a3a84bf7?w=800&q=80",
  },
  {
    category: "food",
    title: "Espresso Alchemy",
    description:
      "Dialing in the perfect shot — grind size, water temperature, pressure profiles, and why the smallest variables make the biggest difference.",
    posterTitle: "The Perfect Shot",
    posterLabel: "Craft",
    posterLayout: "editorial",
    subtitle: { icon: Coffee, text: "Coffee" },
    tags: ["#espresso", "#coffee", "#craft", "#brewing"],
    thumbnail:
      "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&q=80",
  },
  {
    category: "career",
    title: "Navigating Design Politics",
    description:
      "How to advocate for good design in organizations that don't always value it — without burning bridges or losing your mind.",
    posterTitle: "Design Has a Seat",
    posterLabel: "Essay",
    posterLayout: "minimal",
    subtitle: { icon: Landmark, text: "Leadership" },
    tags: ["#leadership", "#design", "#politics", "#advocacy"],
    thumbnail:
      "https://images.unsplash.com/photo-1577415124269-fc1140a69e91?w=800&q=80",
  },
  {
    category: "living",
    title: "Birdwatching for Beginners",
    description:
      "You don't need expensive gear or exotic locations — just patience, silence, and a willingness to look up more often.",
    posterTitle: "Just Look Up",
    posterLabel: "Guide",
    posterLayout: "top",
    subtitle: { icon: Bird, text: "Wildlife" },
    tags: ["#birding", "#nature", "#wildlife", "#beginner"],
    thumbnail:
      "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80",
  },
  {
    category: "career",
    title: "The Pomodoro Illusion",
    description:
      "Why the popular time management technique doesn't work for everyone — and what to try instead when your brain refuses to fit into 25-minute boxes.",
    posterTitle: "Beyond the Timer",
    posterLabel: "Opinion",
    posterLayout: "centered",
    subtitle: { icon: Timer, text: "Productivity" },
    tags: ["#productivity", "#timemanagement", "#focus", "#adhd"],
    thumbnail:
      "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&q=80",
  },
  {
    category: "sports",
    title: "Sailing the Adriatic",
    description:
      "Island-hopping down the Croatian coast — turquoise water, ancient walled cities, and the meditative rhythm of life under sail.",
    posterTitle: "Life Under Sail",
    posterLabel: "Travel Log",
    posterLayout: "editorial",
    subtitle: { icon: Sailboat, text: "Sailing" },
    tags: ["#sailing", "#croatia", "#adriatic", "#islands"],
    thumbnail:
      "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80",
  },
  {
    category: "living",
    title: "Paper Craft and Patience",
    description:
      "The quiet satisfaction of cutting, folding, and assembling — why analog making is the perfect antidote to screen fatigue.",
    posterTitle: "Cut, Fold, Breathe",
    posterLabel: "Craft",
    posterLayout: "minimal",
    subtitle: { icon: Scissors, text: "Paper Craft" },
    tags: ["#papercraft", "#analog", "#handmade", "#craft"],
    thumbnail:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
  },
  {
    category: "trending",
    title: "Accessible by Default",
    description:
      "Stop treating accessibility as a checklist item — a framework for building inclusive products from the ground up.",
    posterTitle: "Inclusion Is Not a Feature",
    posterLabel: "Manifesto",
    posterLayout: "top",
    posterPattern: "dots",
    subtitle: { icon: Ear, text: "Accessibility" },
    tags: ["#a11y", "#inclusive", "#design", "#web"],
    thumbnail:
      "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&q=80",
  },
  {
    category: "travel",
    title: "Golden Hour in Santorini",
    description:
      "White walls catching amber light, the caldera burning orange — photographing the most painted sunset in the world and still finding something new.",
    posterTitle: "Amber on White Walls",
    posterLabel: "Photo Essay",
    posterLayout: "centered",
    subtitle: { icon: SunMedium, text: "Photography" },
    tags: ["#santorini", "#goldenhour", "#photography", "#greece"],
    thumbnail:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
  },
  {
    category: "living",
    title: "Learning Piano at 35",
    description:
      "Starting an instrument as an adult is humbling, frustrating, and quietly transformative — a year of scales, mistakes, and small victories.",
    posterTitle: "It's Never Too Late",
    posterLabel: "Personal",
    posterLayout: "editorial",
    subtitle: { icon: Piano, text: "Music" },
    tags: ["#piano", "#learning", "#music", "#adultstarter"],
    thumbnail:
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80",
  },
  {
    category: "living",
    title: "The Shell Collector",
    description:
      "A meditation on the act of collecting — how small, beautiful things found on the shore teach us about attention and impermanence.",
    posterTitle: "Attention and Impermanence",
    posterLabel: "Essay",
    posterLayout: "minimal",
    subtitle: { icon: Shell, text: "Mindfulness" },
    tags: ["#mindfulness", "#nature", "#collecting", "#slowliving"],
    thumbnail:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  },
  {
    category: "tech",
    title: "Puzzle Design Philosophy",
    description:
      "What makes a great puzzle — the balance between frustration and flow, and why the best puzzles teach you how to solve them.",
    posterTitle: "Frustration Meets Flow",
    posterLabel: "Deep Dive",
    posterLayout: "top",
    subtitle: { icon: Puzzle, text: "Game Design" },
    tags: ["#puzzles", "#gamedesign", "#flow", "#ux"],
    thumbnail:
      "https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=800&q=80",
  },
  {
    category: "food",
    title: "Natural Wine, Honest Wine",
    description:
      "Beyond the hype and the controversy — understanding what natural winemakers are actually doing differently and why it matters.",
    posterTitle: "Nothing Added, Nothing Taken",
    posterLabel: "Culture",
    posterLayout: "centered",
    subtitle: { icon: Wine, text: "Wine" },
    tags: ["#wine", "#natural", "#fermentation", "#culture"],
    thumbnail:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
  },
  {
    category: "beauty",
    title: "Watercolor Loose and Free",
    description:
      "Letting go of precision — how embracing the unpredictable nature of watercolor led to my best work.",
    posterTitle: "Let the Water Lead",
    posterLabel: "Studio",
    posterLayout: "editorial",
    subtitle: { icon: Paintbrush, text: "Painting" },
    tags: ["#watercolor", "#art", "#painting", "#loose"],
    thumbnail:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80",
  },
  {
    category: "beauty",
    title: "Minimalist Jewelry Making",
    description:
      "Designing with restraint — how working with simple forms and honest materials creates pieces that people actually wear every day.",
    posterTitle: "Less Metal, More Meaning",
    posterLabel: "Craft",
    posterLayout: "minimal",
    subtitle: { icon: Gem, text: "Jewelry" },
    tags: ["#jewelry", "#minimalism", "#craft", "#design"],
    thumbnail:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
  },
  {
    category: "living",
    title: "Theatre in Small Spaces",
    description:
      "Why the most powerful performances happen inches from the audience — the intimacy revolution in independent theatre.",
    posterTitle: "Close Enough to Feel It",
    posterLabel: "Culture",
    posterLayout: "top",
    subtitle: { icon: Drama, text: "Theatre" },
    tags: ["#theatre", "#performance", "#intimacy", "#indie"],
    thumbnail:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
  },
  {
    category: "travel",
    title: "Harbor Towns at Low Tide",
    description:
      "When the water pulls back, a hidden world appears — boats resting on mud, ropes going slack, and the geometry of a harbor laid bare.",
    posterTitle: "When the Water Pulls Back",
    posterLabel: "Photo Essay",
    posterLayout: "centered",
    subtitle: { icon: Anchor, text: "Coastal" },
    tags: ["#harbor", "#lowtide", "#photography", "#coastal"],
    thumbnail:
      "https://images.unsplash.com/photo-1500930287596-c1ecaa373bb2?w=800&q=80",
  },
];

// Auto-assign poster icons per category, cycling through CATEGORY_ICONS
const categoryCounts: Partial<Record<Category, number>> = {};
for (const card of mockCards) {
  const count = categoryCounts[card.category] ?? 0;
  const icons = CATEGORY_ICONS[card.category];
  card.posterIcon = icons[count % icons.length];
  categoryCounts[card.category] = count + 1;
}
