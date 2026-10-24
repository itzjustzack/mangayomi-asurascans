# Asura Scans for Mangayomi

## Version 0.0.14

Adds search filters for 35 genres, publishing status, manga type, sort field and direction, minimum chapters, author, and artist. Search uses the public API used by Asura's browse page, with offset pagination and existing public comic URLs.

Refresh Browse → Extensions and update Asura Scans to 0.0.14. Open the source and use the search filter button. Source ID and name are unchanged; no library migration is needed.

Validation: JavaScript syntax, simulated filter/encoding/pagination/error cases, and live API checks for title search, page 2, combined Action + Completed + Manhwa + 100 chapters + title sorting, and empty results passed on 2026-10-24. On-device Mangayomi verification remains pending.
