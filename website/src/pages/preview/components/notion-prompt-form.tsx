import {
  ArrowUp,
  AtSign,
  BookOpen,
  CirclePlus,
  Globe,
  LayoutGrid,
  Paperclip,
  Plus,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const SAMPLE_DATA = {
  mentionable: [
    {
      type: 'page',
      title: 'Meeting Notes',
      image: '📝',
    },
    {
      type: 'page',
      title: 'Project Dashboard',
      image: '📊',
    },
    {
      type: 'page',
      title: 'Ideas & Brainstorming',
      image: '💡',
    },
    {
      type: 'page',
      title: 'Calendar & Events',
      image: '📅',
    },
    {
      type: 'page',
      title: 'Documentation',
      image: '📚',
    },
    {
      type: 'page',
      title: 'Goals & Objectives',
      image: '🎯',
    },
    {
      type: 'page',
      title: 'Budget Planning',
      image: '💰',
    },
    {
      type: 'page',
      title: 'Team Directory',
      image: '👥',
    },
    {
      type: 'page',
      title: 'Technical Specs',
      image: '🔧',
    },
    {
      type: 'page',
      title: 'Analytics Report',
      image: '📈',
    },
    {
      type: 'user',
      title: 'shadcn',
      image: 'https://github.com/shadcn.png',
      workspace: 'Workspace',
    },
    {
      type: 'user',
      title: 'maxleiter',
      image: 'https://github.com/maxleiter.png',
      workspace: 'Workspace',
    },
    {
      type: 'user',
      title: 'evilrabbit',
      image: 'https://github.com/evilrabbit.png',
      workspace: 'Workspace',
    },
  ],
  models: [
    {
      name: 'Auto',
    },
    {
      name: 'Agent Mode',
      badge: 'Beta',
    },
    {
      name: 'Plan Mode',
    },
  ],
}

function MentionableIcon({ item }: { item: (typeof SAMPLE_DATA.mentionable)[0] }) {
  return item.type === 'page' ? (
    <span className="flex size-4 items-center justify-center">{item.image}</span>
  ) : (
    <Avatar className="size-4">
      <AvatarImage src={item.image} />
      <AvatarFallback>{item.title[0]}</AvatarFallback>
    </Avatar>
  )
}

export function NotionPromptForm() {
  const [mentions, setMentions] = useState<string[]>([])
  const [mentionPopoverOpen, setMentionPopoverOpen] = useState(false)
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<{ name: string; badge?: string }>(
    SAMPLE_DATA.models[0] ?? { name: 'Auto' }
  )
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false)

  const grouped = useMemo(() => {
    return SAMPLE_DATA.mentionable.reduce(
      (acc, item) => {
        const isAvailable = !mentions.includes(item.title)

        if (isAvailable) {
          if (!acc[item.type]) {
            acc[item.type] = []
          }
          acc[item.type]?.push(item)
        }
        return acc
      },
      {} as Record<string, typeof SAMPLE_DATA.mentionable>
    )
  }, [mentions])

  const hasMentions = mentions.length > 0

  return (
    <form>
      <Field>
        <FieldLabel className="sr-only" htmlFor="notion-prompt">
          Prompt
        </FieldLabel>
        <InputGroup className="rounded-xl">
          <InputGroupTextarea id="notion-prompt" placeholder="Ask, search, or make anything..." />
          <InputGroupAddon align="block-start" className="pt-3">
            <Popover onOpenChange={setMentionPopoverOpen} open={mentionPopoverOpen}>
              <Tooltip>
                <TooltipTrigger asChild onFocusCapture={e => e.stopPropagation()}>
                  <PopoverTrigger asChild>
                    <InputGroupButton
                      className="transition-transform"
                      size={!hasMentions ? 'sm' : 'icon-sm'}
                      variant="outline"
                    >
                      <AtSign /> {!hasMentions && 'Add context'}
                    </InputGroupButton>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Mention a person, page, or date</TooltipContent>
              </Tooltip>
              <PopoverContent align="start" className="p-0">
                <Command>
                  <CommandInput placeholder="Search pages..." />
                  <CommandList>
                    <CommandEmpty>No pages found</CommandEmpty>
                    {Object.entries(grouped).map(([type, items]) => (
                      <CommandGroup heading={type === 'page' ? 'Pages' : 'Users'} key={type}>
                        {items.map(item => (
                          <CommandItem
                            className="rounded-lg"
                            key={item.title}
                            onSelect={currentValue => {
                              setMentions(prev => [...prev, currentValue])
                              setMentionPopoverOpen(false)
                            }}
                            value={item.title}
                          >
                            <MentionableIcon item={item} />
                            {item.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="no-scrollbar -m-1.5 flex gap-1 overflow-y-auto p-1.5">
              {mentions.map(mention => {
                const item = SAMPLE_DATA.mentionable.find(item => item.title === mention)

                if (!item) {
                  return null
                }

                return (
                  <InputGroupButton
                    className="rounded-full pl-2!"
                    key={mention}
                    onClick={() => {
                      setMentions(prev => prev.filter(m => m !== mention))
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    <MentionableIcon item={item} />
                    {item.title}
                    <X />
                  </InputGroupButton>
                )
              })}
            </div>
          </InputGroupAddon>
          <InputGroupAddon align="block-end" className="gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton aria-label="Attach file" className="rounded-full" size="icon-sm">
                  <Paperclip />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
            <DropdownMenu onOpenChange={setModelPopoverOpen} open={modelPopoverOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton className="rounded-full" size="sm">
                      {selectedModel.name}
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Select AI model</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" className="min-w-48" side="top">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    Select Agent Mode
                  </DropdownMenuLabel>
                  {SAMPLE_DATA.models.map(model => (
                    <DropdownMenuCheckboxItem
                      checked={model.name === selectedModel.name}
                      className="pl-2 *:[span:first-child]:right-2 *:[span:first-child]:left-auto"
                      key={model.name}
                      onCheckedChange={checked => {
                        if (checked) {
                          setSelectedModel(model)
                        }
                      }}
                    >
                      {model.name}
                      {model.badge && (
                        <Badge
                          className="h-5 rounded-sm bg-blue-100 px-1 text-blue-800 text-xs dark:bg-blue-900 dark:text-blue-100"
                          variant="secondary"
                        >
                          {model.badge}
                        </Badge>
                      )}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu onOpenChange={setScopeMenuOpen} open={scopeMenuOpen}>
              <DropdownMenuTrigger asChild>
                <InputGroupButton className="rounded-full" size="sm">
                  <Globe /> All Sources
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72" side="top">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild onSelect={e => e.preventDefault()}>
                    <label htmlFor="web-search">
                      <Globe /> Web Search{' '}
                      <Switch className="ml-auto" defaultChecked id="web-search" />
                    </label>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild onSelect={e => e.preventDefault()}>
                    <label htmlFor="apps">
                      <LayoutGrid /> Apps and Integrations
                      <Switch className="ml-auto" defaultChecked id="apps" />
                    </label>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CirclePlus /> All Sources I can access
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Avatar className="size-4">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      shadcn
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-72 p-0 [--radius:1rem]">
                      <Command>
                        <CommandInput autoFocus placeholder="Find or use knowledge in..." />
                        <CommandList>
                          <CommandEmpty>No knowledge found</CommandEmpty>
                          <CommandGroup>
                            {SAMPLE_DATA.mentionable
                              .filter(item => item.type === 'user')
                              .map(user => (
                                <CommandItem
                                  key={user.title}
                                  onSelect={() => {
                                    // Handle user selection here
                                    console.log('Selected user:', user.title)
                                  }}
                                  value={user.title}
                                >
                                  <Avatar className="size-4">
                                    <AvatarImage src={user.image} />
                                    <AvatarFallback>{user.title[0]}</AvatarFallback>
                                  </Avatar>
                                  {user.title}{' '}
                                  <span className="text-muted-foreground">- {user.workspace}</span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem>
                    <BookOpen /> Help Center
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Plus /> Connect Apps
                  </DropdownMenuItem>
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    We&apos;ll only search in the sources selected here.
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <InputGroupButton
              aria-label="Send"
              className="ml-auto rounded-full"
              size="icon-sm"
              variant="default"
            >
              <ArrowUp />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </form>
  )
}
