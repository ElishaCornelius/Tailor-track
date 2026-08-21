import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode, type ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: {
  children: ReactNode;
} & ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
