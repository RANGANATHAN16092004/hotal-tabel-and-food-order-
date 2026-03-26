export const translations = {
    en: {
        menu: "Menu",
        popular: "Popular Dishes",
        personalized: "Personalized for You",
        addToCart: "Add to Cart",
        total: "Total",
        checkout: "Proceed to Checkout",
        table: "Table",
        search: "Search for flavors...",
        loyalty: "Credits",
        share: "Share"
    },
    hi: {
        menu: "मेनू",
        popular: "लोकप्रिय व्यंजन",
        personalized: "आपके लिए खास",
        addToCart: "कार्ट में जोड़ें",
        total: "कुल",
        checkout: "चेकआउट करें",
        table: "टेबल",
        search: "स्वाद खोजें...",
        loyalty: "क्रेडिट",
        share: "शेयर करें"
    },
    fr: {
        menu: "Menu",
        popular: "Plats Populaires",
        personalized: "Pour Vous",
        addToCart: "Ajouter au Panier",
        total: "Total",
        checkout: "Passer à la Caisse",
        table: "Table",
        search: "Rechercher des saveurs...",
        loyalty: "Crédits",
        share: "Partager"
    },
    es: {
        menu: "Menú",
        popular: "Platos Populares",
        personalized: "Para Ti",
        addToCart: "Añadir al Carrito",
        total: "Total",
        checkout: "Proceder al Pago",
        table: "Mesa",
        search: "Buscar sabores...",
        loyalty: "Créditos",
        share: "Compartir"
    }
};

export const useTranslation = (lang = 'en') => {
    const t = (key) => {
        return translations[lang]?.[key] || translations['en'][key] || key;
    };
    return { t };
};
