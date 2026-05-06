# Rental Platform

Full-stack application for housing rental in Germany. The system provides listing management, search and filtering, booking functionality, reviews, and an AI-powered chat assistant based on Google Gemini.

---

## Technology Stack

**Backend**
- Python 3.12
- Django 6.x + Django REST Framework
- MySQL 8.0
- Redis 7
- Google Gemini API (gemini-2.5-flash-lite)
- Gunicorn

**Frontend**
- React 18 + Vite
- Bootstrap 5
- Axios
- React Router v6

**Infrastructure**
- Docker + Docker Compose
- Nginx (reverse proxy)
- AWS EC2 (deployment)
- AWS S3 (media storage)

---

## Project Structure

```
rental_platform/
├── backend/
│   ├── apps/
│   │   ├── users/        # Authentication, JWT, roles
│   │   ├── listings/     # Listings, search, filters
│   │   ├── bookings/     # Bookings, reviews
│   │   └── ai_chat/      # Gemini chat, analytics
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── local.py
│   │   │   └── prod.py
│   │   └── urls.py
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── docker-compose.dev.yml
```

---

## Features

**Listing Management**
- Create, edit, delete listings
- Toggle listing visibility (active/inactive)
- Photo gallery upload
- View counter with anti-abuse protection (one view per user per month)

**Search and Filtering**
- Full-text search by title and description
- Filter by city, district, property type, price range, number of rooms
- Sorting by price, date, popularity, rating

**Authentication and Authorization**
- JWT-based authentication (access + refresh tokens)
- Two roles: Tenant and Landlord
- Role-based access control

**Booking**
- Create bookings with date validation
- Overlap check for existing bookings
- Landlord can confirm or reject booking requests
- Tenant can cancel bookings
- Automatic status transition to "completed" after checkout date

**Reviews**
- Reviews are only allowed after a completed booking
- One review per booking
- Automatic recalculation of listing average rating

**AI Chat Assistant**
- Conversational interface powered by Google Gemini
- Extracts search parameters from dialogue (city, dates, budget, room count)
- Automatic redirect to listings page with applied filters
- Available only for tenants

**Analytics**
- Search history per user
- Listing view history
- Popular listings by view count
- Popular search queries

**Caching (Redis)**
- Listing list cache: 5 minutes
- Listing detail cache: 5 minutes
- Popular listings cache: 10 minutes
- Popular searches cache: 10 minutes
- Anti-abuse view tracking: 31 days

---

## Local Development Setup

### Requirements

- Python 3.12+
- Node.js 20+
- MySQL 8.0
- Redis 7

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file in the `backend/` directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

DB_NAME=rental_platform
DB_USER=rental_user
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306

REDIS_URL=redis://localhost:6379/0

GEMINI_API_KEY=your-gemini-api-key
```

Run migrations and start the server:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Docker Deployment

### Local Docker (Development)

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Services:
- Django: `http://localhost:8000`
- React: `http://localhost:5173`
- MySQL: port 3306
- Redis: port 6379

### Production Docker

```bash
docker-compose up --build -d
```

The application will be available at `http://localhost` (port 80).

---

## AWS EC2 Deployment

### Step 1 — Prepare the server

Connect to your EC2 instance and install Docker:

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker
```

Verify installation:

```bash
docker --version
docker compose version
```

### Step 2 — Clone the repository

```bash
git clone https://github.com/your-username/rental-platform.git
cd rental-platform/rental_platform
```

### Step 3 — Configure environment

Create `backend/.env` for production:

```env
SECRET_KEY=your-strong-secret-key
DEBUG=False
ALLOWED_HOSTS=your-ec2-ip,your-domain.com

DATABASE_URL=mysql://rental_user:password@db:3306/rental_platform

REDIS_URL=redis://redis:6379/0

CORS_ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com

GEMINI_API_KEY=your-gemini-api-key

AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=eu-central-1
```

### Step 4 — Build and run

```bash
docker compose up --build -d
```

Run initial migrations and create superuser:

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py collectstatic --no-input
```

### Step 5 — Verify deployment

```bash
docker compose ps
docker compose logs web
```

The application should be accessible at `http://your-ec2-ip`.

---

## AWS S3 Setup (Media Files)

1. Create an S3 bucket in the AWS Console
2. Set bucket region to `eu-central-1` (Frankfurt) for optimal performance in Germany
3. Configure bucket policy to allow public read access for media files
4. Create an IAM user with S3 access and add credentials to `.env`

When `DEBUG=False`, all uploaded media files (listing photos) are automatically stored in S3.

---

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register/` | Register new user |
| POST | `/api/users/login/` | Login, returns JWT tokens |
| POST | `/api/users/refresh/` | Refresh access token |
| GET | `/api/users/me/` | Get current user profile |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings/` | List listings with filters |
| POST | `/api/listings/` | Create listing (landlord only) |
| GET | `/api/listings/{id}/` | Listing detail |
| PATCH | `/api/listings/{id}/` | Update listing (owner only) |
| DELETE | `/api/listings/{id}/` | Delete listing (owner only) |
| POST | `/api/listings/{id}/toggle_active/` | Toggle visibility |
| GET | `/api/listings/my/` | My listings (landlord only) |

**Query parameters for filtering:**
- `search` — full-text search
- `city` — filter by city
- `district` — filter by district
- `property_type` — apartment / house / studio / room
- `price_min`, `price_max` — price range
- `rooms_min`, `rooms_max` — room count range
- `ordering` — price_per_night / created_at / view_count / avg_rating

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings/` | List bookings |
| POST | `/api/bookings/` | Create booking (tenant only) |
| POST | `/api/bookings/{id}/confirm/` | Confirm booking (landlord only) |
| POST | `/api/bookings/{id}/reject/` | Reject booking (landlord only) |
| POST | `/api/bookings/{id}/cancel/` | Cancel booking (tenant only) |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/` | List reviews |
| POST | `/api/reviews/` | Create review (tenant, completed booking only) |
| DELETE | `/api/reviews/{id}/` | Delete review (author only) |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message/` | Send message to Gemini |
| POST | `/api/chat/extract/` | Extract search parameters from dialogue |
| POST | `/api/chat/search/` | Search listings by extracted parameters |
| GET | `/api/chat/history/` | Chat session history |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/analytics/popular-listings/` | Most viewed listings |
| GET | `/api/chat/analytics/popular-searches/` | Most frequent search queries |
| GET | `/api/chat/analytics/search-history/` | User search history |
| GET | `/api/chat/analytics/view-history/` | User view history |

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `django-insecure-...` |
| `DEBUG` | Debug mode | `True` / `False` |
| `ALLOWED_HOSTS` | Allowed hosts | `localhost,127.0.0.1` |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `...` |
| `AWS_S3_BUCKET` | S3 bucket name | `rental-platform-media` |
| `AWS_S3_REGION` | S3 bucket region | `eu-central-1` |

---

## Admin Panel

Django admin is available at `/admin/`.

Default superuser is created during initial setup via `createsuperuser` command.

---

## Security Notes

- Never commit `.env` files to version control
- Use a strong `SECRET_KEY` in production (at least 50 characters)
- Set `DEBUG=False` in production
- Configure `ALLOWED_HOSTS` with your actual domain or IP
- Use HTTPS in production with a valid SSL certificate
- Rotate JWT tokens regularly (configured via `SIMPLE_JWT` settings)

---

## License

MIT
