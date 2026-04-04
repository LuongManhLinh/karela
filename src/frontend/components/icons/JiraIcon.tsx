import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export function JiraIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      {/* Just the inner paths of your SVG, not the <svg> tag itself */}
      {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> */}
      <path d="M11.53,2C11.53,4.4 13.5,6.35 15.88,6.35H17.66V8.05C17.66,10.45 19.6,12.39 22,12.4V2.84A0.84,0.84 0 0,0 21.16,2H11.53M6.77,6.8C6.78,9.19 8.72,11.13 11.11,11.14H12.91V12.86C12.92,15.25 14.86,17.19 17.25,17.2V7.63C17.24,7.17 16.88,6.81 16.42,6.8H6.77M2,11.6C2,14 3.95,15.94 6.35,15.94H8.13V17.66C8.14,20.05 10.08,22 12.47,22V12.43A0.84,0.84 0 0,0 11.63,11.59L2,11.6Z" />
      {/* </svg> */}
    </SvgIcon>
  );
}

export function JiraIconColored(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <defs>
          <linearGradient
            id="jira-original-a"
            gradientUnits="userSpaceOnUse"
            x1="22.034"
            y1="9.773"
            x2="17.118"
            y2="14.842"
            gradientTransform="scale(4)"
          >
            <stop offset=".176" stopColor="#0052cc" />
            <stop offset="1" stopColor="#2684ff" />
          </linearGradient>
          <linearGradient
            id="jira-original-b"
            gradientUnits="userSpaceOnUse"
            x1="16.641"
            y1="15.564"
            x2="10.957"
            y2="21.094"
            gradientTransform="scale(4)"
          >
            <stop offset=".176" stopColor="#0052cc" />
            <stop offset="1" stopColor="#2684ff" />
          </linearGradient>
        </defs>
        <path
          d="M108.023 16H61.805c0 11.52 9.324 20.848 20.847 20.848h8.5v8.226c0 11.52 9.328 20.848 20.848 20.848V19.977A3.98 3.98 0 00108.023 16zm0 0"
          fill="#2684ff"
        />
        <path
          d="M85.121 39.04H38.902c0 11.519 9.325 20.847 20.844 20.847h8.504v8.226c0 11.52 9.328 20.848 20.848 20.848V43.016a3.983 3.983 0 00-3.977-3.977zm0 0"
          fill="url(#jira-original-a)"
        />
        <path
          d="M62.219 62.078H16c0 11.524 9.324 20.848 20.848 20.848h8.5v8.23c0 11.52 9.328 20.844 20.847 20.844V66.059a3.984 3.984 0 00-3.976-3.98zm0 0"
          fill="url(#jira-original-b)"
        />
      </svg>
    </SvgIcon>
  );
}
