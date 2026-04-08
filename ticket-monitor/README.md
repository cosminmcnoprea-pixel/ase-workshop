# Ticket Monitor Service

Un microserviciu care monitorizeaza disponibilitatea biletelor de tren pe ruta Bucuresti-Tecuci si trimite notificari prin email.

## Funcionalitati

- **Monitorizare continua**: Verifica disponibilitatea biletelor la intervale regulate
- **Notificari email**: Trimite alerte cand:
  - Biletele devin disponibile (erau epuizate anterior)
  - Numarul de bilete disponibile scade sub 50
  - Toate biletele sunt epuizate
- **API REST**: Endpoint-uri pentru verificare manuala si status
- **Health Check**: Monitorizare sanatate serviciu

## API Endpoints

### Health Check
```
GET /health
```

### Verificare Bilete
```
GET /tickets/check
```
Returneaza informatii curente despre disponibilitatea biletelor.

### Status Monitorizare
```
GET /tickets/status
```
Returneaza statusul curent al serviciului de monitorizare.

### Test Notificare
```
POST /tickets/notify/test
```
Trimite o notificare de test pentru verificarea configurarii email.

## Configurare

1. Copiati `.env.example` in `.env`:
```bash
cp .env.example .env
```

2. Configurati variabilele de mediu in `.env`:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=emailul-tau@gmail.com
SENDER_PASSWORD=parola-aplicatie-tale
RECIPIENT_EMAIL=destinatar@email.com
```

### Gmail Setup

Pentru a folosi Gmail ca sender:

1. Activati **2-Factor Authentication** in contul Gmail
2. Generati o **App Password**:
   - Mergeti la: https://myaccount.google.com/apppasswords
   - Selectati "Mail" si "Other (Custom name)"
   - Nume: "Ticket Monitor"
   - Copiati parola generata (16 caractere)
3. Folositi aceasta parola in `SENDER_PASSWORD`

## Rulare Locala

```bash
# Instalare dependente
pip install -r requirements.txt

# Rulare serviciu
python main.py
```

Serviciul va porni pe portul 8002.

## Rulare cu Docker

```bash
# Build imagine
docker build -t ticket-monitor .

# Rulare container
docker run -p 8002:8002 --env-file .env ticket-monitor
```

## Integrare cu Docker Compose

Adaugati in `docker-compose.yml`:

```yaml
services:
  ticket-monitor:
    build: ./ticket-monitor
    ports:
      - "8002:8002"
    env_file:
      - ./ticket-monitor/.env
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8002/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Logica de Notificare

Serviciul trimite emailuri in urmatoarele situatii:

1. **Bilete devin disponibile**: Cand erau 0 bilete si apar > 0
2. **Disponibilitate redusa**: Cand sunt < 50 bilete disponibile
3. **Epuizare**: Cand erau bilete disponibile si devin 0

Notificarile sunt trimise doar cand statusul se schimba semnificativ pentru a evita spam-ul.

## Exemplu Response

```json
{
  "route": "Bucuresti - Tecuci",
  "available_tickets": 23,
  "status": "low_availability",
  "last_checked": "2026-04-08T15:58:00.123456",
  "next_departure": "14:30"
}
```

## Dezvoltare

Pentru development local, puteti modifica functia `check_ticket_availability()` pentru a integra cu API-ul real al CFR Calatori sau alt furnizor de bilete.
