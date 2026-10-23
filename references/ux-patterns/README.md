# Local research index

`catalog.json` is a deliberately small maintained knowledge base, not a claim to cover every industry. Each record has stable ID, category, search tags, recommendation, source, confidence and license. Three short UX recommendations are adapted from UI/UX Pro Max under its bundled MIT notice; other records are original Tevra guidance.

The TypeScript search engine builds document term counts and corpus document frequencies in memory on each query. Unicode word tokenization, case folding and BM25 (`k1=1.2`, `b=0.75`) rank exact terms; ties use stable IDs. No remote search, embedding service or persistent private index is used. Domain filtering occurs before scoring. Scores describe relevance only. Empty matches remain empty rather than inventing a recommendation.

Add/update records with provenance and focused tags, then add a meaningful relevance test. Current-trend claims need a separately dated source. Framework guidance is maintained in `references/frameworks/` and loaded only for the selected stack.
