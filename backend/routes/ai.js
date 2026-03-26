const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY || 'MISSING_API_KEY';
const ai = new GoogleGenAI({ apiKey: apiKey });

// Cache contextual models based on roles
let sessions = {};

router.post('/chat', async (req, res) => {
    try {
        const { message, context, hotelId, customerId } = req.body;

        // For demo/development purposes if no API key is set
        if (apiKey === 'MISSING_API_KEY') {
            const lowerMessage = message.toLowerCase();
            let reply = "Hello! I am your AI Assistant. (Please set GEMINI_API_KEY in the backend .env to enable real AI capabilities).";
            if (context === 'admin') {
                reply = "Admin Mode Active: I can assist with generating descriptions, analyzing revenue, or managing staff. What would you like to do? (Add API key to unlock features).";
            } else if (context === 'customer') {
                if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
                    reply = "I recommend our Chef's Special Pasta or the Grilled Salmon! They're crowd favorites. (Add API key for dynamic suggestions).";
                } else {
                    reply = `Hello! I can help you with your order, tell you about today's specials, or call the waiter. (Add API key for real conversational AI).`;
                }
            } else if (context === 'staff') {
                reply = "Staff Mode Active: I can help coordinate orders, check table statuses, or resolve conflicts. What do you need? (Add API key to unlock).";
            }

            return res.json({ success: true, response: reply });
        }

        // Prepare system instructions based on context
        let systemInstruction = "You are a helpful assistant.";

        if (context === 'admin') {
            systemInstruction = "You are an expert Restaurant Management AI Assistant. You help the restaurant owner manage operations, write menu descriptions, understand sales trends, and guide them in configuring settings. Be concise, professional, and business-focused.";
        } else if (context === 'customer') {
            systemInstruction = "You are a friendly and polite AI Waiter for 'DineSmart'. You help customers navigate the menu, make food recommendations, and explain hotel services. Do not invent items; gracefully mention that you can recommend typical restaurant dishes. Keep answers short and enthusiastic.";
        } else if (context === 'staff') {
            systemInstruction = "You are an AI Operational Assistant for hotel staff. Help them quickly handle tables, manage stress, answer questions about standard procedures, and provide quick tips on hospitality. Be very concise and supportive.";
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemInstruction + " \\n\\n User says: " + message }] }
            ],
        });

        res.json({
            success: true,
            response: response.text
        });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ success: false, message: 'AI processing failed', error: error.message });
    }
});

router.post('/voice-order', async (req, res) => {
    try {
        const { transcript, menuList } = req.body;

        if (apiKey === 'MISSING_API_KEY') {
            // Mock response
            return res.json({ success: true, items: [] });
        }

        const systemInstruction = `You are a smart AI restaurant assistant. 
The user is speaking their order. Their speech transcript is: "${transcript}".
Here is the menu: ${JSON.stringify(menuList.map(item => ({ id: item._id, name: item.name, price: item.price })))}.

Extract the items the user wants to order. Match them to the menu IDs. Combine phrases logically.
Return ONLY a strictly valid JSON array of objects, with each object having:
- "menuItemId": the _id from the menu
- "quantity": the number they ordered (default 1)
Do not return any markdown or extra text. ONLY JSON array.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemInstruction }] }
            ],
        });

        let rawText = response.text.trim();
        if (rawText.startsWith('```json')) {
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (rawText.startsWith('```')) {
            rawText = rawText.replace(/```/g, '').trim();
        }

        let parsedItems = [];
        try {
            parsedItems = JSON.parse(rawText);
        } catch (e) {
            console.error("Failed to parse AI order JSON:", rawText);
        }

        res.json({ success: true, items: parsedItems });

    } catch (error) {
        console.error('Voice Order AI Error:', error);
        res.status(500).json({ success: false, message: 'Voice processing failed' });
    }
});

module.exports = router;
