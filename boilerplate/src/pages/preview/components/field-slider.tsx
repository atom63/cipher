import { useState } from 'react'

import { Field, FieldDescription, FieldTitle } from '@/components/ui/field'
import { Slider } from '@/components/ui/slider'

export function FieldSlider() {
  const [value, setValue] = useState([200, 800])
  return (
    <div className="w-full max-w-md">
      <Field>
        <FieldTitle>Price Range</FieldTitle>
        <FieldDescription>
          Set your budget range ($
          <span className="font-medium tabular-nums">{value[0]}</span> -{' '}
          <span className="font-medium tabular-nums">{value[1]}</span>).
        </FieldDescription>
        <Slider
          aria-label="Price Range"
          className="mt-2 w-full"
          max={1000}
          min={0}
          onValueChange={v => setValue(v as number[])}
          step={10}
          value={value}
        />
      </Field>
    </div>
  )
}
