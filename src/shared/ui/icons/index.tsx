import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { children?: ReactNode };

export function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="8.5" cy="8.5" r="4.75" />
      <path d="M12.2 12.2 16.5 16.5" />
    </Icon>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4.5 6.5h11" />
      <path d="M7.5 6.5V4.8h5V6.5" />
      <path d="M6 6.5 6.7 15.5h6.6L14 6.5" />
    </Icon>
  );
}

export function RestoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7.2 7.2H4.5V4.5" />
      <path d="M4.8 7.4a5.6 5.6 0 1 1-.6 5.2" />
    </Icon>
  );
}

export function BackupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 3.5v8" />
      <path d="m7 8.5 3 3 3-3" />
      <path d="M4.5 13.5v2.2h11V13.5" />
    </Icon>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h2.2M10.2 6.5H16" />
      <circle cx="8" cy="6.5" r="1.75" />
      <path d="M4 13.5h6.2M14.8 13.5H16" />
      <circle cx="13" cy="13.5" r="1.75" />
    </Icon>
  );
}

export function HelpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M8 8.1a2 2 0 1 1 2.6 1.9c-.7.3-1.1.8-1.1 1.5" />
      <path d="M10 14.3h.01" />
    </Icon>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="3.1" />
      <path d="M10 2.6v1.7M10 15.7v1.7M2.6 10h1.7M15.7 10h1.7M4.6 4.6l1.2 1.2M14.2 14.2l1.2 1.2M15.4 4.6l-1.2 1.2M5.8 14.2l-1.2 1.2" />
    </Icon>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M14.2 12.4A5.4 5.4 0 0 1 8 4.1 5.5 5.5 0 1 0 14.2 12.4z" />
    </Icon>
  );
}

export function AccountIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="7.1" r="2.4" />
      <path d="M4.8 15.4a5.2 5.2 0 0 1 10.4 0" />
    </Icon>
  );
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8.2 4.5H5.2v11h3" />
      <path d="M9 10h6.4" />
      <path d="m13 7.3 2.7 2.7L13 12.7" />
    </Icon>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 4.5v11M4.5 10h11" />
    </Icon>
  );
}

export function BackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12.2 4.5 6.5 10l5.7 5.5" />
      <path d="M6.8 10H16" />
    </Icon>
  );
}

export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="4.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4.5" width="13" height="11" rx="1.5" />
      <circle cx="7.2" cy="8" r="1.05" />
      <path d="m4.6 13.4 3.4-3 2.2 2 2-1.6 3.2 2.6" />
    </Icon>
  );
}

export function DeleteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 3.5h5L14.5 7V16.5H6z" />
      <path d="M11 3.5V7h3.5" />
      <path d="m8.2 10.3 3.5 3.5M11.7 10.3l-3.5 3.5" />
    </Icon>
  );
}

export function TextColorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6.2 15 10 4.6 13.8 15" />
      <path d="M7.5 11.6h5" />
      <path d="M5 17.2h10" />
    </Icon>
  );
}

export function HighlightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.8 13.2h12.4" strokeWidth={3} />
      <path d="m12.2 4.6 2 2-6 6H6.2v-2z" />
    </Icon>
  );
}

export function LetterSpacingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.4 10h2.6M14 10h2.6" />
      <path d="m3.4 10 1.3-1.2M3.4 10l1.3 1.2M16.6 10 15.3 8.8M16.6 10l-1.3 1.2" />
      <path d="M8.3 14.6 10 5.4l1.7 9.2M8.8 11.7h2.4" />
    </Icon>
  );
}

export function LineHeightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6.2 5h8.6M6.2 10h8.6M6.2 15h8.6" />
      <path d="M3.4 7.4v5.2" />
      <path d="m3.4 7.4-1.1 1.1M3.4 7.4l1.1 1.1M3.4 12.6l-1.1-1.1M3.4 12.6l1.1-1.1" />
    </Icon>
  );
}

export function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8.3 11.7 6.8 13.2a2.5 2.5 0 0 1-3.5-3.5L4.8 8.2" />
      <path d="m11.7 8.3 1.5-1.5a2.5 2.5 0 0 1 3.5 3.5L15.2 11.8" />
      <path d="m8.5 11.5 3-3" />
    </Icon>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" />
      <path d="M3.5 8h13M7 3.4v2.6M13 3.4v2.6" />
    </Icon>
  );
}

export function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 12.5V4.2" />
      <path d="m7.2 6.8 2.8-2.8 2.8 2.8" />
      <path d="M4.5 13.5v2.2h11V13.5" />
    </Icon>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m5 5 10 10M15 5 5 15" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m4.5 10.4 3.6 3.6 7.4-8" />
    </Icon>
  );
}

export function WarningIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 3.4 17.2 16.2H2.8z" />
      <path d="M10 8.2v3.5" />
      <path d="M10 14.3h.01" />
    </Icon>
  );
}
