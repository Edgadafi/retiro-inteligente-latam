import type { ElementType, HTMLAttributes, ReactNode } from "react";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

/** Clases tipográficas del Brand Kit Rito */
export const ritoType = {
  displayH1: "rito-display-h1",
  financialData: "rito-financial-data",
  bodyText: "rito-body-text",
  label: "rito-label",
  wordmark: "rito-wordmark",
  subtitle: "rito-subtitle",
} as const;

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function DisplayH1({
  children,
  className,
  as: Tag = "h1",
  ...props
}: TypographyProps) {
  return (
    <Tag className={cn(ritoType.displayH1, className)} {...props}>
      {children}
    </Tag>
  );
}

export function FinancialData({
  children,
  className,
  as: Tag = "span",
  ...props
}: TypographyProps) {
  return (
    <Tag className={cn(ritoType.financialData, className)} {...props}>
      {children}
    </Tag>
  );
}

export function BodyText({
  children,
  className,
  as: Tag = "p",
  ...props
}: TypographyProps) {
  return (
    <Tag className={cn(ritoType.bodyText, className)} {...props}>
      {children}
    </Tag>
  );
}

export function RitoLabel({
  children,
  className,
  as: Tag = "span",
  ...props
}: TypographyProps) {
  return (
    <Tag className={cn(ritoType.label, className)} {...props}>
      {children}
    </Tag>
  );
}
