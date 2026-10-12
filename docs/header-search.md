# Archivsuche in der Navigation

Umsetzung zu GitHub-Issue #48, ergänzend zu #11.

## Verhalten

Die obere Navigation enthält das Suchfeld „Archiv durchsuchen…“. Enter und die Lupen-Schaltfläche öffnen `/archive?q=…`. Leere Eingaben werden ignoriert, der Begriff wird beim Absenden getrimmt und URL-kodiert. Im mobilen Menü steht dieselbe Suche; nach Absenden schließt sich das Menü.

Das Archiv liest den Suchbegriff aus der URL. Änderungen im Archivfeld ersetzen den aktuellen Verlaufseintrag. Direkte Suchlinks, Neuladen und Zurück/Vorwärts übernehmen den jeweiligen Begriff. Das Zurücksetzen entfernt Suchbegriff und Kategorieauswahl.

## Technik

- `frontend/src/components/ArchiveSearch.jsx`: wiederverwendbares Suchformular mit zugänglichen Beschriftungen und Tastaturfokus.
- `frontend/src/components/Header.jsx`: Einbindung für Desktop und Mobilgeräte; Navigation kann bei Platzmangel umbrechen.
- `frontend/src/pages/Archive.jsx`: URL als Quelle des Suchbegriffs, kurze Verzögerung von 250 ms für API-Abfragen und Schutz gegen verspätete Antworten früherer Suchanfragen. Während eine neue Suche aussteht, werden keine Treffer eines älteren Begriffs angezeigt. Kategorien filtern die Suchtreffer weiterhin lokal.
- `frontend/src/services/api.js`: öffentliche Dokumentensuche über `/api/public/documents?q=…`; alle Ergebnisseiten werden geladen, damit Kategorien keine späteren Treffer verlieren.
- `backend/controllers/publicController.js`: vorhandene öffentliche Suche wird wiederverwendet. Titel, Jahr, Ort, Kategorien, Beschreibung, Transkription, Quelle und Autor werden durchsucht. Die Antwort enthält zusätzlich Kategorie-IDs und die ältere Einzelkategorie für den bestehenden Kategorienfilter.

Die öffentliche API liefert ausschließlich freigegebene Beiträge, die nicht vom Archiv ausgeschlossen wurden. Gesucht wird ohne Beachtung der Groß-/Kleinschreibung nach der eingegebenen Zeichenfolge. Es wird keine neue OCR-Verarbeitung durchgeführt.

## Prüfung

- Frontend: `npm run build` und `npm run lint` erfolgreich.
- Öffentlichen Controller mit vorhandenen Daten geprüft: 96 sichtbare Beiträge, Treffer für einen Begriff ausschließlich in der Transkription, Ausschluss unveröffentlichter Beiträge und leere Trefferliste bei unbekanntem Begriff.
- Browserprüfung: mobile Menüsuche per Enter, Desktopsuche per Lupe, Umlaute und `&` in der URL, Neuladen, Zurück-Navigation, Kombination mit einer Kategorie und Zurücksetzen.
- Responsive Darstellung mit eingeblendeten internen Menüpunkten geprüft.

Die Umsetzung ist lokal; Veröffentlichung und Deployment sind separat.
