const defaultTheme = require('tailwindcss/defaultTheme')

function withOpacity(variableName) {
	return ({ opacityValue }) => {
	  if (opacityValue !== undefined) {
		return `rgba(var(${variableName}), ${opacityValue})`;
	  }
	  return `rgb(var(${variableName}))`;
	};
}
  
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", "[data-theme='dark']"],
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    // Remove the following screen breakpoint or add other breakpoints
    // if one breakpoint is not enough for you
    screens: {
      sm: "640px",
    },

    extend: {
      accentColor: {
        skin: {
          base: withOpacity("--color-accent"),
        },
      },
      textColor: {
        skin: {
        base: withOpacity("--color-text-base"),
        accent: withOpacity("--color-accent"),
        inverted: withOpacity("--color-fill"),
        },
      },
      backgroundColor: {
        skin: {
        fill: withOpacity("--color-fill"),
        accent: withOpacity("--color-accent"),
        inverted: withOpacity("--color-text-base"),
        card: withOpacity("--color-card"),
        "card-muted": withOpacity("--color-card-muted"),
        },
      },
      outlineColor: {
        skin: {
        fill: withOpacity("--color-accent"),
        },
      },
      borderColor: {
        skin: {
        line: withOpacity("--color-border"),
        fill: withOpacity("--color-text-base"),
        accent: withOpacity("--color-accent"),
        },
      },
      fill: {
        skin: {
        base: withOpacity("--color-text-base"),
        accent: withOpacity("--color-accent"),
        },
        transparent: "transparent",
      },
      stroke: {
        skin: {
        accent: withOpacity("--color-accent")
        }
      },
      fontFamily: {
        header: ["Roboto"],
        writing: ["Lora"],
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'), 
    require('flowbite/plugin')
  ]
};
