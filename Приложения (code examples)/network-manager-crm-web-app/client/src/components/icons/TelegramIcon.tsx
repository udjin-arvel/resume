import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

export const TelegramIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 16, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      {...props}
    >
      <g clipPath="url(#telegram-icon-clip)">
        <path
          d="M14.0085 0.722339C14.3697 0.59613 14.7711 0.686521 15.0421 0.957495C15.3126 1.2281 15.4035 1.62879 15.2781 1.98953L15.2788 1.99031L10.9452 14.6575C10.8097 15.0528 10.4427 15.3226 10.0249 15.3333C9.63826 15.3432 9.28566 15.1282 9.11165 14.7887C9.09659 14.7624 9.08266 14.7349 9.07103 14.7059V14.7052L6.9515 9.41843L6.92337 9.35671C6.84999 9.21718 6.72887 9.10732 6.58118 9.04812H6.5804L1.29368 6.92781C0.906013 6.7722 0.655751 6.39227 0.666339 5.97468L0.681964 5.82078C0.745967 5.46882 0.995577 5.1731 1.34134 5.05437L1.34212 5.05359L14.0085 0.720777V0.722339ZM2.62259 6.0239L7.0765 7.81062L7.26165 7.89578C7.62065 8.08395 7.91429 8.37693 8.10306 8.73562L8.18821 8.92078L8.189 8.92156L9.97415 13.3747L13.7968 2.20203L2.62259 6.0239Z"
          fill="currentColor"
        />
        <path
          d="M14.0976 0.960155C14.358 0.699817 14.7802 0.699793 15.0406 0.960155C15.3006 1.22045 15.3006 1.64205 15.0406 1.90234L7.74682 9.19531C7.48651 9.45546 7.06495 9.45546 6.80464 9.19531C6.5443 8.93495 6.54428 8.51268 6.80464 8.25234L14.0976 0.960155Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="telegram-icon-clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
) satisfies LucideIcon;

TelegramIcon.displayName = "TelegramIcon";
