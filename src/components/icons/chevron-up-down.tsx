import * as React from "react";

interface ChevronUpDownProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function ChevronUpDown({ className, ...props }: ChevronUpDownProps) {
  return (
    <svg
      viewBox="5 3 8 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M6.57269 7.32232L9.00313 4.96545L11.4336 7.32232C11.6778 7.55923 12.0725 7.55923 12.3168 7.32232C12.5611 7.08542 12.5611 6.70273 12.3168 6.46583L9.44161 3.67768C9.19731 3.44078 8.80269 3.44078 8.55839 3.67768L5.68322 6.46583C5.43892 6.70273 5.43892 7.08542 5.68322 7.32232C5.92752 7.55315 6.32839 7.55922 6.57269 7.32232Z"
        fill="currentColor"
      />
      <path
        d="M11.4273 10.6777L8.99687 13.0345L6.56644 10.6777C6.32215 10.4408 5.92752 10.4408 5.68322 10.6777C5.43893 10.9146 5.43893 11.2973 5.68322 11.5342L8.55839 14.3223C8.80269 14.5592 9.19731 14.5592 9.44161 14.3223L12.3168 11.5342C12.5611 11.2973 12.5611 10.9146 12.3168 10.6777C12.0725 10.4468 11.6716 10.4408 11.4273 10.6777Z"
        fill="currentColor"
      />
    </svg>
  );
}
