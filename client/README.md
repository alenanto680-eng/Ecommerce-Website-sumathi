# Sumathi Trenez — React Project

## Folder Structure

```
sumathi-trenez/
├── index.html                    # Vite HTML entry point
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite + React plugin config
│
├── public/                       # Static assets (place your images here)
│   ├── logo.png
│   ├── hero-model.png
│   ├── about.png
│   ├── cat-boys.png
│   ├── cat-girls.png
│   ├── cat-infants.png
│   ├── product1.png … product4.png
│   ├── best1.png … best5.png
│   ├── WhyChoosing.png
│   └── review.png
│
└── src/
    ├── main.jsx                  # React DOM render entry
    ├── App.jsx                   # Root layout (Navbar + Page + Footer)
    │
    ├── pages/
    │   └── Home.jsx              # Composes all sections
    │
    ├── components/
    │   ├── Navbar.jsx            # Sticky nav with logo, links, cart
    │   ├── Hero.jsx              # Hero banner with CTA & trust bar
    │   ├── About.jsx             # Brand story section
    │   ├── Category.jsx          # Shop by category (Boys / Girls / Infants)
    │   ├── NewArrivals.jsx       # Tabbed product grid
    │   ├── BestSelling.jsx       # 3D orbit carousel
    │   ├── WhyUs.jsx             # Feature highlights grid
    │   ├── Reviews.jsx           # Testimonial section
    │   └── Footer.jsx            # Site footer with links & contact
    │
    └── styles/
        ├── globals.css           # CSS variables, reset, animations
        ├── Navbar.css
        ├── Hero.css
        ├── About.css
        ├── Category.css
        ├── NewArrivals.css
        ├── BestSelling.css
        ├── WhyUs.css
        ├── Reviews.css
        └── Footer.css
```

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Adding Your Images

Place all image files inside the `public/` directory. They are referenced as
`./filename.png` in components. Fallback Unsplash images are used automatically
when local files are missing.

## Tech Stack

- **React 18** — UI components
- **Vite** — Dev server & bundler
- **lucide-react** — Icons
- **CSS Modules (plain CSS)** — Per-component stylesheets
