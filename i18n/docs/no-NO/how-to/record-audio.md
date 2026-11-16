<!-- source: 648b5aad742b -->

# Ta opp mikrofon og systemlyd

Vibe tar opp fra enhetene du velger og transkriberer deretter opptaket. Bruk denne veiledningen for samtaler, møter og lyd som spilles av i stedet for å være lagret som en fil. [Støttede formater](/vibe/docs#formats) dekker filer.

## Velg enhetene

1. Åpne Vibe og velg **Ta opp**.
1. Under **Mikrofon** velger du inndataenheten. Vibe husker enheten etter navn.
1. Under **Høyttalere** velger du utdataenheten som skal fange systemlyd. Velg **Ingen** for å ta opp bare mikrofonen.

Opptak av begge enhetene slår dem sammen til ett spor med ffmpeg, slik at begge sider av en samtale havner i samme transkripsjon.

## Gi tillatelser på macOS

Åpne **Innstillinger → Opptak → Tillatelser** og gi det opptaket trenger:

| Tillatelse | Brukes til |
| --- | --- |
| Mikrofon | Mikrofonlyd |
| Systemlyd | Lyd som spilles av på Macen (Skjerm- og systemlydopptak) |

Uten tillatelse for systemlyd åpner macOS loopback-strømmen, men tar opp stillhet, så opptaket er ikke brukbart.

## Ta opp og transkriber

1. Trykk **Ta opp**.
1. Bruk **Stopp** når samtalen er over.
1. Opptaket åpnes med en språkvelger. Velg et språk eller la det stå på automatisk.
1. Trykk **Transkriber**.

Hvis **Transkriber opptak automatisk** er slått på i **Innstillinger → Opptak**, starter det siste trinnet av seg selv.

## Neste steg

- [Oppsummer en transkripsjon](/vibe/docs#summarize-transcripts) når opptaket er ferdig.
- [Bruk møtenettleseren](/vibe/docs#use-the-meeting-browser) for å ta opp en samtale i Vibe.
