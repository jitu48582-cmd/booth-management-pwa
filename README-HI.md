# बूथ मैनेजमेंट PWA — मोबाइल से चलने वाला शुरुआती डेमो

## सबसे आसान तरीका (सिर्फ Android फोन से)
1. GitHub पर अकाउंट बनाएँ/लॉगिन करें।
2. नया repository बनाएँ, उदाहरण: `booth-management-pwa`।
3. इस ZIP की फाइलें repository में upload करें (Add file → Upload files)।
4. Settings → Pages में जाएँ।
5. Deploy from a branch चुनें; Branch `main`, folder `/(root)` चुनें और Save करें।
6. कुछ मिनट बाद GitHub Pages द्वारा दिखाए गए URL को Chrome में खोलें।
7. Chrome के ⋮ मेनू में “Add to Home screen” या “Install app” चुनें।

अगर GitHub मोबाइल साइट पर फाइल अपलोड मुश्किल हो, तो पहले repository बनाएँ और browser में “Desktop site” विकल्प आजमा सकते हैं।

## अभी क्या काम करता है?
- डेमो PIN स्क्रीन
- बूथ जोड़ना/हटाना
- संपर्क जोड़ना/हटाना और खोज
- WhatsApp/SMS सहमति स्थिति दर्ज करना
- CSV export और JSON backup/restore
- PWA manifest और offline shell cache

## बहुत जरूरी सीमाएँ
- यह **डेमो** है। PIN असली सुरक्षा नहीं है।
- रिकॉर्ड केवल उसी ब्राउज़र के localStorage में रहते हैं। अन्य फोन/टीम के साथ सिंक नहीं होते।
- वास्तविक/संवेदनशील मतदाता डेटा डालने से पहले Supabase जैसे सुरक्षित सर्वर, असली authentication, database access policies, audit logs और backup सेटअप करें।
- इस static demo से कोई SMS या WhatsApp नहीं भेजा जाता।
- असली संदेश के लिए आधिकारिक WhatsApp Business Platform या अधिकृत SMS provider, server-side consent/opt-out checks, आवश्यक registration/templates और लागू चुनावी नियमों की समीक्षा चाहिए।
- PWA install होना APK बनाने के बराबर नहीं है; यह browser-based installable web app है।

## सुरक्षित अगला चरण
जब डेमो UI ठीक लगे, इसे Supabase Auth + PostgreSQL + Row Level Security से जोड़ें। Provider API keys कभी browser JavaScript में न रखें। चुनावी प्रचार के लिए संवेदनशील व्यक्तिगत डेटा या राजनीतिक पसंद का अनुमान लगाकर लक्ष्यीकरण न करें; तथ्यात्मक और अनुमत सूचना तक सीमित रहें।
