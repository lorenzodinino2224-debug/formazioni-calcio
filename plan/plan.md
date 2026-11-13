# Città di Spoltore – Gestionale Tecnico (Web App PWA, dati solo sull'iPhone)

Web app da aprire in Safari e installare sulla schermata Home dell'iPhone per gestire la rosa, la formazione in campo, i convocati e i moduli PDF della squadra.
Tutto quello che inserisci resta solo nella memoria dell'iPhone, l'app funziona anche offline e puoi salvare o ripristinare un backup completo su file.

## Analisi dell'architettura attuale
- **Server/cloud**: il progetto attuale **non salva niente** su server, database online o cloud. Il server presente nel template non viene usato e non riceve dati.
- **Dove finiscono i dati oggi**: nella versione web vanno nella memoria del browser con un sistema semplice (localStorage). Ha poco spazio (circa 5 MB) e con le foto si riempie in fretta, quindi va sostituito.
- **Foto**: nella versione web vengono salvate dentro i dati come testo. Questo pesa e non regge decine di foto.
- **Offline e installazione**: oggi mancano. Non c'è un file che dice a Safari come installare l'app né un sistema che la faccia aprire senza rete.
- **Backup**: oggi manca.

## Modifiche necessarie
1. **Archivio locale su IndexedDB**: tutti i dati (giocatori, foto, formazione attuale, schemi salvati, convocazioni, dati società) passano su IndexedDB, che è la memoria locale del browser più affidabile e capiente. Le foto vengono salvate come immagini compresse e non più come testo. Con una migrazione automatica, i dati già inseriti si spostano nel nuovo archivio senza perdite.
2. **Memoria persistente**: l'app chiede a Safari di tenere i dati in modo permanente. Su iPhone, se l'app è installata sulla schermata Home, Safari non cancella i dati quando non la usi per un po'.
3. **PWA installabile**: icona col logo, nome "Spoltore", apertura a schermo intero senza la barra di Safari e colore bordeaux. Nell'app trovi anche una guida breve: "Condividi → Aggiungi alla schermata Home".
4. **Funzionamento offline**: dopo la prima apertura, l'app salva sul telefono tutti i file che le servono e si apre e funziona anche senza internet.
5. **Nessun invio di dati**: nessuna chiamata a server, API o cloud con i tuoi dati e nessuna sincronizzazione. Il sito pubblicato serve solo a scaricare l'app.
6. **Backup e ripristino**: esporti un unico file con tutti i dati e tutte le foto e lo salvi in File, iCloud Drive (se lo scegli tu), AirDrop o email. Poi puoi reimportarlo per ripristinare tutto.
7. **Funzioni attuali mantenute**: Rosa, Formazione con tutti i moduli (compresi 4-3-1-2, 4-3-2-1 e 4-1-3-2), panchina, schemi salvati, Convocati e PDF stampabili (Distinta convocati, Formazione in campo, Rosa completa).

## Per chi è
L'allenatore e lo staff tecnico della Città di Spoltore, che usano l'iPhone a bordo campo e in spogliatoio, anche dove la rete non c'è.

## Funzioni ed esperienza principali
- All'avvio appare il logo della società.
- **Rosa**: aggiungi, modifichi ed elimini i giocatori con foto (dalla galleria o dalla fotocamera), numero, ruolo, piede, data di nascita e note. Puoi filtrare per ruolo.
- **Formazione**: scegli il modulo, tocchi una posizione e assegni il giocatore, gestisci la panchina, salvi e ricarichi gli schemi.
- **Convocati**: crei una convocazione con avversario, data, ora, ritrovo, campo, casa/trasferta e note, poi spunti i giocatori.
- **Stampa**: crei i PDF da stampare o condividere e imposti i dati della società che compaiono nei moduli.
- **Backup** (nella sezione Stampa/Impostazioni):
  - "Esporta backup" crea il file con tutto.
  - "Importa backup" chiede conferma e poi sostituisce i dati attuali con quelli del file.
  - Vedi la data dell'ultimo backup e lo spazio occupato.
- Se il backup non viene fatto da più di 30 giorni compare un promemoria, perché i dati esistono solo sull'iPhone.

## Flusso utente
1. Apri il link in Safari e vedi il logo, poi la Rosa.
2. Segui la guida e aggiungi l'app alla schermata Home.
3. Da quel momento la apri dall'icona, anche offline.
4. Inserisci giocatori e foto, prepari formazione e convocati e crei i PDF.
5. Ogni tanto tocchi "Esporta backup" e salvi il file.
6. Se cambi iPhone, o se i dati vengono cancellati, tocchi "Importa backup", scegli il file e tutto viene ripristinato.

## UI/UX
Stessa grafica di adesso: bordeaux e blu della società, logo nell'intestazione, campo verde verticale e tasti grandi da usare con il pollice. La sezione Backup è sobria, con un'indicazione chiara che i dati sono solo sul dispositivo.

## Fasi di sviluppo
- **Fase 1 (MVP, da fare ora)**:
  - archivio IndexedDB con migrazione dei dati esistenti e memoria persistente
  - PWA installabile da Safari con funzionamento offline
  - backup completo con foto ed esportazione/importazione
  - guida all'installazione e promemoria backup
  - verifica che tutte le funzioni attuali e i PDF funzionino nella web app
- **Fase 2**: dati società estesi (staff, dirigenti), schede giocatore più complete (presenze, minuti, gol, cartellini) e storico delle convocazioni per giocatore.
- **Fase 3**: lavagna tattica con frecce e movimenti, allenamenti e presenze, statistiche stagionali stampabili.

## Assunzioni
- Una sola squadra (Città di Spoltore), come adesso.
- Solo la web app da Safari viene sviluppata e verificata. Il codice dell'app per telefono resta nel progetto ma non viene più curato.
- Il backup è un unico file che contiene i dati e le foto, e lo salvi dove vuoi tu tramite il menu Condividi di iPhone.
- L'importazione **sostituisce** i dati attuali e non li unisce, sempre dopo una conferma.
- Le foto vengono compresse a una dimensione adatta al telefono e ai PDF, per risparmiare spazio.
- Il promemoria backup scatta dopo 30 giorni.
- I PDF da Safari si aprono con la finestra di stampa/condivisione di iPhone, da cui puoi stampare o salvare come PDF.
- La pubblicazione online serve solo a distribuire l'app: nessun dato dell'utente passa dal sito.
- Limite di iPhone: se cancelli i dati di Safari o disinstalli l'app dalla schermata Home, i dati vengono persi. Per questo serve il backup.

## Stima del lavoro
Non posso calcolare in anticipo il numero esatto di crediti, perché dipende da quante correzioni serviranno durante i test. Come ordine di grandezza è un intervento **medio**, più piccolo della prima creazione dell'app: un ciclo di sviluppo e un giro di test completo. Il consumo reale lo vedi nel tuo pannello Emergent mentre lavoro.
