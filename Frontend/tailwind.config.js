/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // 'media' or 'class'
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    theme: {
        extend: {
            // Custom scrollbar utilities
            scrollbar: {
                width: '0px', // Hide scrollbar but keep functionality
                track: 'transparent',
                thumb: 'transparent'
            }
        }
    },
    plugins: [
        // Plugin for custom scrollbar styling
        function ({ addUtilities }) {
            const newUtilities = {
                '.scrollbar-hide': {
                    '-ms-overflow-style': 'none',
                    'scrollbar-width': 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none'
                    }
                },
                '.scrollbar-thin': {
                    'scrollbar-width': 'thin',
                    '&::-webkit-scrollbar': {
                        width: '4px',
                        height: '4px'
                    }
                },
                '.scrollbar-light': {
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#cccccc'
                    }
                },
                '.scrollbar-dark': {
                    '&::-webkit-scrollbar-track': {
                        background: '#374151'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#4b5563'
                    }
                }
            }
            addUtilities(newUtilities, ['responsive', 'hover'])
        }
    ]
}
