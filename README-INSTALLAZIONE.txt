SUPERLEGA V1 - INSTALLAZIONE

1) Copia tutti i file di questa cartella dentro la tua cartella SUPERLEGA, sostituendo quelli esistenti.
2) Apri il terminale nella cartella SUPERLEGA ed esegui:
   npm install
3) In Supabase vai su Project Settings > API e copia:
   - Project URL
   - anon public key
4) Nella cartella SUPERLEGA crea un file chiamato .env con:
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
5) In Supabase > SQL Editor esegui il file supabase-setup.sql.
6) In Supabase > Authentication > Users crea il tuo utente admin con email e password.
7) Avvia:
   npm run dev
8) Quando funziona:
   git add .
   git commit -m "V1.0 - app SUPERLEGA funzionante"
   git push

Nota: il file .env non viene caricato su GitHub. Su Netlify dovrai aggiungere le stesse due variabili in Site configuration > Environment variables.
