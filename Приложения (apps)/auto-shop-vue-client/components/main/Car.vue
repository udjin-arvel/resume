<template>
  <div :class="$style.wrap">
    <div :class="$style.car">
      <div :class="$style.car__cont">
        <div :class="$style.car__left">
          <div :class="$style.car__abs">
            <div :class="$style.car__num">
              2–8
            </div>
            <div :class="$style.car__hours">
              {{ $t('land.hours') }}
            </div>
          </div>

          <svg
            :class="$style.car__svg"
            xmlns="http://www.w3.org/2000/svg"
            width="384"
            height="384"
            viewBox="0 0 384 384"
            fill="none"
          >
            <g filter="url(#filter0_d_312_693)">
              <circle
                cx="192"
                cy="184"
                r="161"
                transform="rotate(90 192 184)"
                fill="white"
              />
              <circle
                cx="192"
                cy="184"
                r="161"
                transform="rotate(90 192 184)"
                stroke="#6A6267"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
            <path
              :class="$style.rotate"
              d="M294.545 101.833C288.654 101.833 283.878 106.609 283.878 112.5C283.878 118.391 288.654 123.167 294.545 123.167C300.436 123.167 305.212 118.391 305.212 112.5C305.212 106.609 300.436 101.833 294.545 101.833ZM82.0421 232.833C76.1511 232.833 71.3754 237.609 71.3754 243.5C71.3754 249.391 76.1511 254.167 82.0421 254.167C87.9331 254.167 92.7088 249.391 92.7088 243.5C92.7088 237.609 87.9331 232.833 82.0421 232.833ZM317 184L315 184C315 251.931 259.931 307 192 307L192 309L192 311C262.14 311 319 254.14 319 184L317 184ZM294.545 112.5L292.905 113.645C306.832 133.581 315 157.834 315 184L317 184L319 184C319 156.988 310.565 131.94 296.185 111.355L294.545 112.5ZM192 309L192 307C145.267 307 104.618 280.938 83.8002 242.547L82.0421 243.5L80.2839 244.453C101.774 284.083 143.742 311 192 311L192 309Z"
              fill="#D51313"
            />
            <path
              opacity="0.1"
              d="M115.355 229.184C127.713 249.327 147.567 263.737 170.55 269.242C193.532 274.747 217.76 270.896 237.904 258.538C258.047 246.18 272.456 226.326 277.961 203.343C283.466 180.361 279.616 156.133 267.258 135.989"
              stroke="#1A1117"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <defs>
              <filter
                id="filter0_d_312_693"
                x="0"
                y="0"
                width="384"
                height="384"
                filterUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB"
              >
                <feFlood
                  flood-opacity="0"
                  result="BackgroundImageFix"
                />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="8" />
                <feGaussianBlur stdDeviation="15" />
                <feComposite
                  in2="hardAlpha"
                  operator="out"
                />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_312_693"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_312_693"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
        </div>
        <div :class="$style.car__right">
          <div :class="$style.car__title">
            {{ $t('land.find2') }}
          </div>
          <div :class="$style.car__text">
            {{ $t('land.china') }}
          </div>
        </div>
      </div>
    </div>
    <div :class="$style.car">
      <div :class="$style.car__cont">
        <div :class="$style.car__first">
          <div :class="$style.car__title">
            {{ $t('land.find3') }}
          </div>
          <div :class="[$style.car__text, $style.car__mobile]">
            {{ $t('land.china2') }}
          </div>
        </div>
        <div :class="$style.car__second">
          <div :class="$style.car__days">
            <div :class="$style.car__num">
              10–30
            </div>
            <div :class="$style.car__hours">
              {{ $t('land.days') }}
            </div>
          </div>

          <svg
            :class="$style.car__svg"
            xmlns="http://www.w3.org/2000/svg"
            width="384"
            height="354"
            viewBox="0 0 384 354"
            fill="none"
          >
            <g filter="url(#filter0_d_312_736)">
              <path
                d="M31 73.3125C31 45.5257 53.5257 23 81.3125 23H302.688C330.474 23 353 45.5257 353 73.3125V274.75C353 285.425 348.759 295.663 341.211 303.211C333.663 310.759 323.425 315 312.75 315H71.25C60.575 315 50.3373 310.759 42.7889 303.211C35.2406 295.663 31 285.425 31 274.75V73.3125Z"
                fill="white"
              />
              <path
                d="M31 73.3125C31 45.5257 53.5257 23 81.3125 23H302.688C330.474 23 353 45.5257 353 73.3125V274.75C353 285.425 348.759 295.663 341.211 303.211C333.663 310.759 323.425 315 312.75 315H71.25C60.575 315 50.3373 310.759 42.7889 303.211C35.2406 295.663 31 285.425 31 274.75V73.3125Z"
                stroke="#6A6267"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
            <path
              d="M31 83.5H353"
              stroke="#6A6267"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M105.5 25.5V24H108.5V25.5H105.5ZM108.5 45.5C108.5 46.3284 107.828 47 107 47C106.172 47 105.5 46.3284 105.5 45.5H108.5ZM107 25.5H108.5V45.5H107H105.5V25.5H107Z"
              fill="#6A6267"
            />
            <path
              d="M275.5 25.5V24H278.5V25.5H275.5ZM278.5 45.5C278.5 46.3284 277.828 47 277 47C276.172 47 275.5 46.3284 275.5 45.5H278.5ZM277 25.5H278.5V45.5H277H275.5V25.5H277Z"
              fill="#6A6267"
            />
            <g>
              <rect
                :class="$style.pulse"
                x="59.5"
                y="107.5"
                width="39"
                height="35"
                rx="10.5"
                stroke="#3E2D38"
              />
              <rect
                :class="$style.pulse"
                opacity="0.5"
                x="119.5"
                y="107.5"
                width="39"
                height="35"
                rx="10.5"
                stroke="#3E2D38"
              />
              <rect
                :class="$style.pulse"
                opacity="0.2"
                x="179.5"
                y="107.5"
                width="39"
                height="35"
                rx="10.5"
                stroke="#3E2D38"
              />
              <rect
                :class="$style.pulse"
                opacity="0.05"
                x="239.5"
                y="107.5"
                width="39"
                height="35"
                rx="10.5"
                stroke="#3E2D38"
              />
              <rect
                :class="$style.pulse"
                x="283.5"
                y="259.5"
                width="39"
                height="35"
                rx="10.5"
                stroke="#3E2D38"
              />
              <rect
                :class="$style.pulse"
                opacity="0.5"
                x="223.5"
                y="259.5"
                width="39"
                height="35"
                rx="10.5"
                stroke="#3E2D38"
              />
              <rect
                :class="$style.pulse"
                opacity="0.2"
                x="163.5"
                y="259.5"
                width="39"
                height="35"
                rx="10.5"
                stroke="#3E2D38"
              />
              <rect
                :class="$style.pulse"
                opacity="0.05"
                x="103.5"
                y="259.5"
                width="39"
                height="35"
                rx="10.5"
                stroke="#3E2D38"
              />
            </g>
            <defs>
              <filter
                id="filter0_d_312_736"
                x="0"
                y="0"
                width="384"
                height="354"
                filterUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB"
              >
                <feFlood
                  flood-opacity="0"
                  result="BackgroundImageFix"
                />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="8" />
                <feGaussianBlur stdDeviation="15" />
                <feComposite
                  in2="hardAlpha"
                  operator="out"
                />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_312_736"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_312_736"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
    </div>
    <div :class="$style.car">
      <div :class="$style.car__cont">
        <div :class="[$style.car__left, $style.car__leftMobile]">
          <svg
            :class="$style.car__svg"
            xmlns="http://www.w3.org/2000/svg"
            width="343"
            height="347"
            viewBox="0 0 343 347"
            fill="none"
          >
            <g filter="url(#filter0_d_392_1354)">
              <path
                d="M30.75 263.875V294.491C30.75 298.992 33.6 303.101 38.1362 305.107C41.0694 306.414 43.8719 307.767 47.2681 307.767H54.4415C57.8378 307.767 60.6403 306.414 63.5853 305.107C68.0978 303.101 70.9596 298.992 70.9596 294.491V275.75M229.243 275.75V294.491C229.243 298.992 232.093 303.101 236.629 305.107C239.562 306.414 241.162 307.767 244.558 307.767H251.732C255.128 307.767 257.931 306.414 260.876 305.107C265.388 303.101 268.25 298.992 268.25 294.491V263.875M60.4375 168.875L73.3575 130.103C78.5825 114.428 81.195 106.591 87.4175 102.114C93.64 97.6369 101.905 97.625 118.423 97.625H180.577C197.095 97.625 205.36 97.625 211.571 102.114C217.805 106.591 220.417 114.428 225.643 130.103L238.562 168.875"
                fill="white"
              />
            </g>
            <path
              d="M54.5 207.779C117.195 215.697 181.821 215.772 244.5 207.779M244.499 248.064H238.563M83.962 274.218L84.4782 269.331C86.3699 262.528 89.868 255.498 95.5101 251.999C113.529 253.356 175.018 253.543 204.692 251.999C209.205 255.063 213.234 259.684 215.736 269.331L216.24 274.218M30.75 263.875V294.491C30.75 298.992 33.6 303.101 38.1362 305.107C41.0694 306.414 43.8719 307.767 47.2681 307.767H54.4415C57.8378 307.767 60.6403 306.414 63.5853 305.107C68.0978 303.101 70.9597 298.992 70.9597 294.491V275.75M229.243 275.75V294.491C229.243 298.992 232.093 303.101 236.629 305.107C239.562 306.414 241.162 307.767 244.558 307.767H251.732C255.128 307.767 257.931 306.414 260.876 305.107C265.388 303.101 268.25 298.992 268.25 294.491V263.875M54.5 162.938L42.625 157M60.4375 168.875L73.3575 130.103C78.5825 114.428 81.195 106.591 87.4175 102.114C93.64 97.6369 101.905 97.625 118.423 97.625H180.577C197.095 97.625 205.36 97.625 211.571 102.114C216.079 105.351 218.693 110.346 221.771 118.791L225.895 131L238.563 168.5M54.5 248.064H60.4375M54.5 254.064H60.4375M244.499 254.064H238.563M244.5 162.937L256.375 157"
              stroke="#6A6267"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M60.4375 168.875H238.562C249.927 180.916 268.25 197.672 268.25 216.375V257.581C268.25 264.35 263.738 270.05 257.764 270.845L220.75 275.75H78.25L41.2356 270.845C35.2625 270.074 30.75 264.373 30.75 257.581V216.375C30.75 197.672 49.0731 180.916 60.4375 168.875Z"
              stroke="#6A6267"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M77.3575 134.103L67.4375 165.875H233L218.771 122.791C215.693 114.346 213.079 109.351 208.571 106.114C202.36 101.625 199.5 101.625 187.577 101.625H122.423C105.905 101.625 97.64 101.637 91.4175 106.114C85.195 110.591 82.5825 118.428 77.3575 134.103Z"
              fill="url(#paint0_linear_392_1354)"
            />
            <g :class="$style.swing">
              <path
                d="M226.768 102.525C227.801 98.7993 231.659 96.6168 235.384 97.65L272.002 107.805C275.727 108.838 277.91 112.696 276.877 116.421L264.521 160.976C264.127 162.394 263.29 163.651 262.154 164.586C252.075 172.877 246.734 179.473 242.072 191.233C240.691 194.717 236.95 196.729 233.346 195.7L223.736 192.958C220.43 192.015 218.32 188.812 218.643 185.39C219.783 173.283 219.264 164.686 214.581 151.397C214.091 150.008 214.019 148.497 214.413 147.077L226.768 102.525Z"
                fill="white"
              />
              <path
                d="M223.999 196L230.58 197.835M264.521 160.976L276.877 116.421C277.91 112.696 275.727 108.838 272.002 107.805L235.384 97.65C231.659 96.6168 227.801 98.7993 226.768 102.525L214.413 147.077C214.019 148.497 214.091 150.008 214.581 151.397C219.264 164.686 219.783 173.283 218.643 185.39C218.32 188.812 220.43 192.015 223.736 192.958L233.346 195.7C236.95 196.729 240.691 194.717 242.072 191.233C246.734 179.473 252.075 172.877 262.154 164.586C263.29 163.651 264.127 162.394 264.521 160.976Z"
                stroke="#D51313"
                stroke-width="3"
                stroke-linejoin="round"
              />
              <rect
                x="234.093"
                y="107.93"
                width="34"
                height="26"
                rx="7"
                transform="rotate(15.5 234.093 107.93)"
                fill="white"
                stroke="#D51313"
                stroke-width="3"
                stroke-linejoin="round"
              />
              <path
                d="M235.974 127.752C235.453 127.607 234.965 127.375 234.511 127.055C234.06 126.727 233.69 126.348 233.402 125.92L234.507 124.555C234.763 124.926 235.055 125.235 235.384 125.481C235.721 125.73 236.084 125.908 236.47 126.015C237.217 126.222 237.851 126.136 238.372 125.758C238.896 125.37 239.29 124.7 239.555 123.747L239.798 122.87L239.973 122.918C239.793 123.324 239.544 123.647 239.225 123.888C238.906 124.129 238.549 124.282 238.154 124.346C237.767 124.413 237.362 124.388 236.94 124.271C236.4 124.121 235.95 123.856 235.591 123.476C235.243 123.089 235.008 122.626 234.886 122.089C234.773 121.554 234.797 120.994 234.96 120.409C235.134 119.78 235.428 119.261 235.842 118.852C236.258 118.435 236.747 118.154 237.31 118.01C237.873 117.866 238.474 117.883 239.113 118.06C240.345 118.401 241.178 119.083 241.611 120.104C242.047 121.116 242.054 122.382 241.633 123.902C241.339 124.963 240.916 125.824 240.365 126.485C239.825 127.139 239.181 127.575 238.432 127.794C237.684 128.013 236.865 127.999 235.974 127.752ZM237.932 122.788C238.211 122.866 238.476 122.871 238.726 122.805C238.977 122.739 239.193 122.605 239.375 122.404C239.566 122.205 239.702 121.957 239.785 121.66C239.872 121.346 239.884 121.058 239.82 120.798C239.768 120.532 239.652 120.306 239.471 120.12C239.292 119.926 239.064 119.79 238.785 119.712C238.497 119.632 238.227 119.63 237.973 119.705C237.723 119.771 237.506 119.905 237.325 120.106C237.145 120.299 237.012 120.552 236.925 120.867C236.842 121.164 236.827 121.445 236.879 121.712C236.931 121.978 237.048 122.204 237.229 122.39C237.41 122.576 237.644 122.708 237.932 122.788ZM244.468 130.107C243.947 129.962 243.459 129.73 243.005 129.411C242.554 129.082 242.184 128.704 241.896 128.275L243.001 126.911C243.257 127.282 243.549 127.591 243.878 127.837C244.215 128.085 244.578 128.263 244.964 128.371C245.711 128.578 246.345 128.492 246.866 128.113C247.39 127.726 247.784 127.056 248.049 126.102L248.292 125.225L248.467 125.274C248.287 125.679 248.038 126.002 247.719 126.243C247.4 126.484 247.043 126.637 246.648 126.702C246.261 126.769 245.856 126.744 245.434 126.627C244.894 126.477 244.444 126.212 244.085 125.831C243.737 125.444 243.502 124.982 243.38 124.444C243.267 123.909 243.291 123.35 243.454 122.765C243.628 122.135 243.922 121.616 244.336 121.208C244.752 120.791 245.241 120.51 245.804 120.366C246.367 120.222 246.968 120.238 247.606 120.415C248.839 120.757 249.671 121.438 250.105 122.459C250.541 123.471 250.548 124.737 250.127 126.257C249.833 127.319 249.41 128.18 248.859 128.84C248.319 129.495 247.675 129.931 246.926 130.15C246.178 130.368 245.359 130.354 244.468 130.107ZM246.426 125.144C246.705 125.221 246.969 125.227 247.22 125.161C247.471 125.095 247.687 124.961 247.869 124.759C248.06 124.561 248.196 124.313 248.279 124.016C248.366 123.701 248.378 123.414 248.314 123.154C248.262 122.888 248.146 122.662 247.965 122.476C247.786 122.281 247.558 122.145 247.279 122.068C246.991 121.988 246.721 121.986 246.467 122.061C246.217 122.127 246 122.261 245.818 122.462C245.639 122.654 245.506 122.908 245.419 123.223C245.336 123.52 245.321 123.801 245.373 124.067C245.425 124.334 245.542 124.56 245.723 124.745C245.904 124.931 246.138 125.064 246.426 125.144ZM252.962 132.463C252.441 132.318 251.953 132.086 251.499 131.766C251.048 131.438 250.678 131.059 250.39 130.631L251.495 129.266C251.751 129.637 252.043 129.946 252.372 130.192C252.709 130.441 253.072 130.619 253.458 130.726C254.205 130.933 254.839 130.847 255.36 130.469C255.884 130.082 256.278 129.411 256.543 128.458L256.786 127.581L256.961 127.63C256.781 128.035 256.532 128.358 256.213 128.599C255.894 128.84 255.537 128.993 255.142 129.057C254.755 129.124 254.35 129.099 253.928 128.982C253.388 128.832 252.938 128.567 252.579 128.187C252.231 127.8 251.996 127.337 251.874 126.8C251.761 126.265 251.785 125.705 251.947 125.121C252.122 124.491 252.416 123.972 252.83 123.564C253.246 123.146 253.735 122.866 254.298 122.721C254.861 122.577 255.462 122.594 256.1 122.771C257.333 123.113 258.165 123.794 258.599 124.815C259.035 125.827 259.042 127.093 258.621 128.613C258.327 129.674 257.904 130.535 257.352 131.196C256.813 131.85 256.169 132.287 255.42 132.505C254.672 132.724 253.853 132.71 252.962 132.463ZM254.92 127.499C255.199 127.577 255.463 127.582 255.714 127.516C255.965 127.45 256.181 127.316 256.363 127.115C256.554 126.916 256.69 126.668 256.773 126.371C256.86 126.057 256.872 125.769 256.808 125.51C256.756 125.243 256.64 125.017 256.459 124.832C256.28 124.637 256.052 124.501 255.773 124.423C255.485 124.344 255.215 124.341 254.961 124.416C254.71 124.482 254.494 124.616 254.312 124.818C254.133 125.01 254 125.264 253.913 125.578C253.83 125.875 253.815 126.157 253.867 126.423C253.919 126.689 254.036 126.915 254.217 127.101C254.398 127.287 254.632 127.42 254.92 127.499Z"
                fill="#D51313"
              />
              <path
                d="M237.1 145.544C239.308 143.088 243.373 144.215 244.001 147.458L244.857 151.876C245.022 152.731 245.462 153.508 246.109 154.09L249.456 157.1C251.912 159.308 250.785 163.373 247.542 164.001L243.123 164.857C242.269 165.023 241.492 165.462 240.91 166.109L237.9 169.456C235.692 171.912 231.627 170.785 230.999 167.542L230.143 163.124C229.977 162.269 229.538 161.492 228.89 160.91L225.543 157.9C223.088 155.692 224.215 151.627 227.457 150.999L231.876 150.143C232.731 149.977 233.508 149.538 234.09 148.891L237.1 145.544Z"
                fill="white"
                stroke="#D51313"
                stroke-width="3"
                stroke-linejoin="round"
              />
              <circle
                cx="237.5"
                cy="157.5"
                r="4.5"
                fill="white"
                stroke="#D51313"
                stroke-width="3"
                stroke-linejoin="round"
              />
            </g>

            <defs>
              <filter
                id="filter0_d_392_1354"
                x="0.75"
                y="75.625"
                width="297.5"
                height="270.142"
                filterUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB"
              >
                <feFlood
                  flood-opacity="0"
                  result="BackgroundImageFix"
                />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="8" />
                <feGaussianBlur stdDeviation="15" />
                <feComposite
                  in2="hardAlpha"
                  operator="out"
                />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_392_1354"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_392_1354"
                  result="shape"
                />
              </filter>
              <linearGradient
                id="paint0_linear_392_1354"
                x1="103"
                y1="106"
                x2="123"
                y2="155"
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  offset="0.2"
                  stop-color="#1A1117"
                  stop-opacity="0.1"
                />
                <stop
                  offset="0.85"
                  stop-color="#1A1117"
                  stop-opacity="0"
                />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div :class="$style.car__right">
          <div :class="$style.car__title">
            {{ $t('land.find4') }}
          </div>
          <div :class="$style.car__mid">
            {{ $t('land.cost') }}
          </div>
          <div :class="$style.car__text">
            <div>{{ $t('land.service') }}</div>
            <MainOl
              :items="[
                { key: 'land.li1' },
                { key: 'land.li2' },
                { key: 'land.li3' },
                { key: 'land.li4' },
              ]"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style module>
.wrap {
  @apply pb-[4.3rem]
}
.swing {
  @apply origin-center animate-swing;
}

.pulse {
  @apply origin-center;
}

.pulse:nth-child(1) {
  @apply animate-pulse;
}

.pulse:nth-child(2) {
  @apply animate-pulse-delayed-1;
}

.pulse:nth-child(3) {
  @apply animate-pulse-delayed-2;
}

.pulse:nth-child(4) {
  @apply animate-pulse-delayed-3;
}

.pulse:nth-child(5) {
  @apply animate-pulse-delayed-4;
}

.pulse:nth-child(6) {
  @apply animate-pulse-delayed-5;
}

.pulse:nth-child(7) {
  @apply animate-pulse-delayed-6;
}

.pulse:nth-child(8) {
  @apply animate-pulse-delayed-7;
}

.rotate {
  @apply origin-center animate-rotate;
}

.car {
  @apply mx-auto max-w-full mb-[1.3125rem] px-[0.625rem] w-[71.25rem];
}
.car__left:hover {
  @apply -translate-y-6 transition-transform duration-300;
}
.car__second:hover {
  @apply -translate-y-6 transition-transform duration-300;
}
.car_last{
  @apply mb-[5.5625rem];
}
.car__mid {
  @apply text-[1.5rem] mb-[0.625rem];
}

.car__svg {
  @apply block w-full h-auto;
}

.car__cont {
  @apply flex flex-wrap;
}

.car__left {
  @apply relative w-[27.625rem] px-[1.875rem] transition-transform duration-300;
}

.car__days {
  @apply absolute text-center w-full text-grey text-[1.5rem] top-[10.1875rem];
}

.car__abs {
  @apply top-[9.875rem]   absolute text-center w-[85%] text-grey text-[1.5rem];
}

.car__num {
  @apply text-[3.125rem] font-bold leading-[0.9] text-primary mb-0;
}

.car__right {
  @apply w-[37.625rem] pr-[1.875rem] pt-[3.5625rem];
}

.car__first {
  @apply w-[44.125rem] pl-[3.8125rem] pr-[1.875rem] pt-[3.5625rem];
}

.car__second {
  @apply relative w-[24rem] transition-transform duration-300;
}

.car__title {
  @apply mb-[0.8125rem] text-[2.75rem] font-bold leading-[1.05];
}

.car__text {
  @apply text-grey text-[1.5rem] mb-[0.625rem];
}
@media (max-width: 1200px)
{
  .car__right {
    @apply pr-0 w-[30rem] pl-[0.625rem];
  }

  .car__title {
    @apply text-[1.5rem] mb-[0.75rem];
  }

  .car__text {
    @apply text-[1.125rem] mb-[2.5rem];
  }

  .car__abs {
    @apply text-[1rem] top-[6.125rem] w-full;
  }

  .car__num {
    @apply text-[2.125rem];
  }

  .car__first {
    @apply w-[30rem] pl-0 pr-[0.625rem];
  }

  .car__days {
    @apply top-[7rem] text-[1rem];
  }

  .car__left,
  .car__second {
    @apply pl-0 pr-0 w-[15.9375rem];
  }
}
@media (max-width: 900px)
{
  .car__left,
  .car__second {
    @apply mx-auto;
  }

  .car__text {
    @apply text-left;
  }

  .car__right {
    @apply w-full pt-[0.9375rem] px-0 text-center;
  }

  .car__first {
    @apply order-2 w-full pt-[0.9375rem] px-0 text-center;
  }
  .wrap {
    @apply pb-[2rem];
  }

}
@media (max-width: 640px) {
  .car__left:hover,
  .car__second:hover {
    @apply transform-none;
  }
  .car__mobile {
    margin-bottom: -2rem;
  }
  .car__leftMobile {
    margin-left: auto;
    margin-right: auto;
    position: relative;
    left: 1rem;
  }
}
</style>
