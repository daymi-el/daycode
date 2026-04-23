import { PROVIDER_DISPLAY_NAMES, type ProviderKind } from "@t3tools/contracts";
import { type SVGProps } from "react";
import { ClaudeAI, CursorIcon, type Icon, OpenAI, OpenCodeIcon } from "./Icons";
import { cn } from "../lib/utils";

type ProviderIconKey = ProviderKind | "cursor";

const PROVIDER_ICON_BY_PROVIDER: Record<ProviderIconKey, Icon> = {
  codex: OpenAI,
  claudeAgent: ClaudeAI,
  cursor: CursorIcon,
  opencode: OpenCodeIcon,
};

export function getProviderDisplayName(provider: string | null | undefined): string | null {
  if (provider === "codex" || provider === "claudeAgent" || provider === "cursor" || provider === "opencode") {
    return PROVIDER_DISPLAY_NAMES[provider];
  }
  return null;
}

export function getProviderIconClassName(
  provider: string | null | undefined,
  fallbackClassName: string,
): string {
  return provider === "claudeAgent" ? "text-[#d97757]" : fallbackClassName;
}

export function ProviderIcon({
  provider,
  className,
  fallbackClassName = "text-muted-foreground/70",
  ...props
}: {
  provider: string | null | undefined;
  fallbackClassName?: string;
} & SVGProps<SVGSVGElement>) {
  const Icon = provider ? PROVIDER_ICON_BY_PROVIDER[provider as ProviderIconKey] : null;
  if (!Icon) {
    return null;
  }

  return (
    <Icon
      {...props}
      className={cn(getProviderIconClassName(provider, fallbackClassName), className)}
    />
  );
}
