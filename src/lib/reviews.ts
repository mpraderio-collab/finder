export type Review = {
  author: string;
  rating: number;
  text: string;
};

// Reseñas de ejemplo mientras no hay compras reales todavía.
// Reemplazar por reseñas reales de clientes cuando existan.
export const mockReviews: Record<string, Review[]> = {
  "lampara-lectura-led": [
    {
      author: "Julieta R.",
      rating: 5,
      text: "La uso todas las noches, no despierto a mi pareja y el brillo bajo es justo lo que necesitaba.",
    },
    {
      author: "Nico F.",
      rating: 5,
      text: "Se carga rápido y dura muchísimo. La llevo en la mochila al trabajo.",
    },
    {
      author: "Ceci M.",
      rating: 4,
      text: "Muy buena luz, me hubiese gustado que sea un poco más ancha para libros grandes.",
    },
  ],
  "luz-rgb-sensor-movimiento": [
    {
      author: "Martín D.",
      rating: 5,
      text: "La puse en el pasillo y es un golazo, se enciende justo a tiempo y el control remoto anda perfecto.",
    },
    {
      author: "Sol A.",
      rating: 5,
      text: "Los colores son mucho más lindos en persona. Quedó genial en el dormitorio.",
    },
  ],
  "luz-escritorio-magnetica": [
    {
      author: "Fede L.",
      rating: 4,
      text: "Excelente para el escritorio, se pega firme y el control táctil es cómodo.",
    },
    {
      author: "Vale G.",
      rating: 5,
      text: "La cambio de temperatura según la hora del día, se nota la diferencia trabajando de noche.",
    },
  ],
};
