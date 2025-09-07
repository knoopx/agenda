import * as React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import classNames from "classnames";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 500,
  className,
}) => (
  <RadixTooltip.Provider delayDuration={delayDuration}>
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          className={classNames(
            "z-50 px-2 py-1 bg-base-01 border border-base-04 rounded-md text-base-05 text-xs shadow-lg select-none",
            className,
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-base-04" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  </RadixTooltip.Provider>
);
