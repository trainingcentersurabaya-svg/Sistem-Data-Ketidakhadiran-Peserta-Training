/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        indomaret: {
          blue: '#0056b3',    // Biru utama Indomaret
          yellow: '#FFD700',  // Kuning aksen Indomaret
          red: '#ED1C24',     // Merah aksen / bahaya Indomaret
          bg: '#F4F7F6',      // Latar belakang bersih lembut
        },
      },
      fontFamily: {
        title: ['var(--font-montserrat)', 'sans-serif'],
        body: ['var(--font-nunito)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [],
};
