<!-- source: dc7efd39c01b -->

# Dlaczego kanały aktualizacji działają w ten sposób

GitHub ma jedno „najnowsze wydanie”. Vibe potrzebuje trzech linii — Wydanie, Beta i Dev — między którymi użytkownik może się przełączać, także ze starszej instalacji. Ta niezgodność napędza projekt kanałów.

## Dlaczego witryna, a nie GitHub

Aplikacja odczytuje `updater/<channel>.json` z witryny. Każdy plik to `latest.json` wygenerowany przez kompilację wydania, skopiowany obok pozostałych:

- Wydanie → `stable.json`
- Beta → `beta.json`
- Dev → `dev.json`

Plik kanału to statyczny zasób wdrażany wraz z witryną, więc wskazanie linii na kompilację jest commitem, a nie edycją wydania. Pozwala też, aby brakujący kanał znaczył coś precyzyjnego: `404` lub `410` to „nic na tej linii”, co aplikacja zgłasza jako aktualne. Gdyby aplikacja przy brakującym pliku przechodziła do innego kanału, użytkownik Beta bez kandydata zostałby po cichu przeniesiony do Wydania.

## Dlaczego sufiks beta to `-rc.<n>`

Semver sortuje:

```text
X.Y.Z-dev.N < X.Y.Z-rc.N < X.Y.Z
```

To porządkowanie jest całym powodem takiej pisowni. Przy ścisłym porównaniu aktualizatora Dev → Beta → Wydanie zawsze porusza się do przodu; żadne specjalne nadpisanie nie jest potrzebne.

Wcześniejsza linia używała `-beta.N`, ale nie miała kanału dev. `X.Y.Z-beta.N` sortuje się powyżej `X.Y.Z-dev.N`, więc kompilacja beta wyglądałaby na nowszą niż każda kompilacja dev i psuła przełączanie. Kanał beta zachowuje nazwę; tylko sufiks wersji to `-rc.<n>`.

## Dlaczego beta zawiera tylko wersje kandydujące

Do `beta.json` zapisywana jest tylko wersja `X.Y.Z-rc.<n>`; zwykłe wydanie jest odrzucane. Dzięki temu linia beta pozostaje znacząca: to linia kandydująca, a nie druga stabilna linia. Po stabilnym wydaniu instalacja Beta przechodzi do finalnego przez przełączenie kanału na Wydanie, gdzie `X.Y.Z` sortuje się powyżej swoich wersji kandydujących.

## Aktualizacje tylko do przodu

Aktualizator porusza się tylko do przodu. Złe wydanie naprawia się, dostarczając nowsze, i właśnie do tego służy linia beta: wychwycić je, zanim trafi do Wydania. To także powód, dla którego instalacja Wydania lub Beta, która wybierze Dev, widzi „Aktualne”: każda kompilacja dev sortuje się poniżej wersji, która jest już uruchomiona. Przejście na linię dev wymaga jednej ręcznej instalacji kompilacji dev; potem kanał Dev aktualizuje ją do przodu.

## Kompromisy

- **Kopiowane manifesty** oznaczają, że zmiana kanału to commit do `main` plus wdrożenie witryny, a nie wywołanie API. Opóźnienie to minuty, a historia jest możliwa do przejrzenia.
- **Brak przechodzenia między kanałami** oznacza, że użytkownik widzi dokładne „Aktualne”, a nie niespodziewany downgrade lub skok między liniami.
- **Dev wymaga jednej ręcznej instalacji** to cena uczciwego porządkowania semver. Automatyzacja wymagałaby koncepcji kanału, której stare klienty nie mają.

## Powiązane strony

- [Kanały aktualizacji](/vibe/docs#update-channels) dla plików i reguł wersji.
- [Przełączanie kanałów aktualizacji](/vibe/docs#switch-update-channels) dla kroków.
