'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps as BaseProps,
} from 'next-themes'

// ✅ Add `children` to the exported props
type Props = BaseProps & { children?: React.ReactNode }

export function ThemeProvider({ children, ...props }: Props) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
