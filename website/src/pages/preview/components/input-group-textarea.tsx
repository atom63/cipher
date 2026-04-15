import { Code2, Copy, CornerDownLeft, RefreshCw } from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group'

export function InputGroupTextareaExample() {
  return (
    <div className="grid w-full max-w-md gap-4">
      <InputGroup>
        <InputGroupTextarea
          className="min-h-[180px]"
          id="textarea-code-32"
          placeholder="console.log('Hello, world!');"
        />
        <InputGroupAddon align="block-end" className="border-t">
          <InputGroupText>Line 1, Column 1</InputGroupText>
          <InputGroupButton className="ml-auto" size="sm" variant="default">
            Run <CornerDownLeft />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupAddon align="block-start" className="border-b">
          <InputGroupText className="font-medium font-mono">
            <Code2 />
            script.js
          </InputGroupText>
          <InputGroupButton className="ml-auto">
            <RefreshCw />
          </InputGroupButton>
          <InputGroupButton variant="ghost">
            <Copy />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
