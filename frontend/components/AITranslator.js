'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AITranslator() {
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Helper to get the translated language from the current portal's local storage
        const getLanguageFromStorage = () => {
            if (pathname.includes('/staff')) return localStorage.getItem('staff_language') || 'english';
            if (pathname.includes('/admin')) return localStorage.getItem('admin_language') || 'english';
            return localStorage.getItem('customer_language') || 'english';
        };

        const targetLang = getLanguageFromStorage();
        const googLang = targetLang === 'tamil' ? 'ta' : 'en';

        // Set Google Translate Cookie to force language translation
        const domain = window.location.hostname;
        document.cookie = `googtrans=/en/${googLang}; path=/; domain=${domain}`;
        document.cookie = `googtrans=/en/${googLang}; path=/`;

        // Only inject script if it's Tamil, OR if we need to reset the widget
        if (!document.getElementById('google-translate-script')) {
            window.googleTranslateElementInit = () => {
                // Initialize widget gracefully
                try {
                    new window.google.translate.TranslateElement(
                        {
                            pageLanguage: 'en',
                            includedLanguages: 'ta,en',
                            autoDisplay: false,
                        },
                        'google_translate_element'
                    );
                } catch (e) {
                    console.error(e);
                }
            };

            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.body.appendChild(script);
        }
    }, [mounted, pathname]);

    if (!mounted) return null;

    return (
        <div
            id="google_translate_element"
            style={{ display: 'none' }} // Hide the widget UI completely
        />
    );
}
