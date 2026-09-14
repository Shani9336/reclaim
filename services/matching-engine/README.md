# FoundIt Matching Engine

A Python FastAPI microservice that powers the AI-based item matching for FoundIt.

## Architecture

```
Next.js API Route  →  POST /match  →  FastAPI Service  →  sentence-transformers
     ↑                                                           ↓
  Returns top-K                                         384-dim embeddings
  matches with                                          cosine similarity
  scores + reasoning
```

## Algorithm

**Composite Score** = 0.50 × text + 0.20 × category + 0.15 × color + 0.15 × date

| Signal | Weight | Method |
|--------|--------|--------|
| Text similarity | 50% | Cosine distance between sentence-transformer embeddings |
| Category match | 20% | Exact match (binary) |
| Color similarity | 15% | Color group fuzzy matching |
| Date proximity | 15% | Days difference scoring |

**Model**: `all-MiniLM-L6-v2` — 22M params, 384-dim embeddings, ~80ms CPU inference.

## Setup

### Local Development

```bash
cd services/matching-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env

# Run the service
python main.py
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

### Docker

```bash
# Build
docker build -t foundit-matcher .

# Run
docker run -p 8000:8000 --env-file .env foundit-matcher
```

## API Endpoints

### `GET /health`
Returns service status and model info. Used by Railway/Render for health checks.

```json
{
  "status": "ok",
  "model": "sentence-transformers/all-MiniLM-L6-v2",
  "model_loaded": true
}
```

### `POST /match`
Finds the best matching found items for a given lost item.

**Headers**: `X-API-Key: your-api-key`

**Request**:
```json
{
  "lost_item": {
    "id": "item_123",
    "title": "Black iPhone 15 Pro Max",
    "description": "Lost my black iPhone with blue case near the canteen",
    "category": "ELECTRONICS",
    "color": "black",
    "brand": "Apple",
    "date_lost": "2024-09-10T00:00:00Z"
  },
  "found_items": [...],
  "top_k": 10
}
```

**Response**:
```json
{
  "matches": [
    {
      "found_item_id": "item_456",
      "score": 0.9412,
      "reasoning": {
        "text": 0.92,
        "category": 1.0,
        "color": 1.0,
        "date": 1.0
      }
    }
  ],
  "total": 1
}
```

### `POST /embed`
Returns the embedding vector for a text. Used to pre-cache item embeddings.

## Deployment (Railway)

1. Push to GitHub
2. Create new Railway project → Deploy from GitHub
3. Set environment variables from `.env.example`
4. Railway auto-detects the Dockerfile and deploys

The deployed URL is your `MATCHING_SERVICE_URL` in the Next.js `.env.local`.

## Viva Defense Notes

**Q: Why sentence-transformers instead of keyword matching?**
A: Keyword matching (TF-IDF) fails for semantic equivalents: "mobile phone" vs "smartphone" 
have zero overlap but high semantic similarity. Sentence-transformers encode text into dense 
vector spaces where semantic similarity = geometric proximity.

**Q: Why all-MiniLM-L6-v2 specifically?**
A: It's a distilled model — 22M params vs 110M for BERT-base — achieving 80% of the accuracy 
at 5x the speed. It runs well on CPU (no GPU needed for MVP). The "MiniLM" architecture uses 
knowledge distillation from a larger teacher model.

**Q: What is cosine similarity?**
A: For two vectors a and b: cos(θ) = (a·b) / (|a| × |b|). After L2-normalization (which 
sentence-transformers does by default), it reduces to just the dot product a·b. 
Values range [0, 1] where 1 = identical meaning, 0 = unrelated.
