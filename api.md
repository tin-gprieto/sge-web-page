# Excel Integration API — Frontend Endpoint Specifications

Base URL:
http://localhost:8000

Content-Type:
application/json

---

## 1. Health Check

### GET /health

### Description
Service availability check.

### Request
No body.

### Response
```json
{
  "status": "OK"
}
```

---

## 2. Get Expedition Participants

### GET /expedition

### Description
Returns all participants for a given expedition and year.

### Request Body
```json
{
  "expedition": "string",
  "year": 2026
}
```

### Response
```json
{
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 123456,
      "career": "string",
      "phone_number": "string",
      "has_won": true
    }
  ]
}
```

### Response Schema

| Field        | Type    | Description                          |
|--------------|---------|--------------------------------------|
| list         | array   | List of participants                 |
| first_name   | string  | Participant first name               |
| last_name    | string  | Participant last name                |
| census       | number  | Student registry number              |
| career       | string  | Career name                          |
| phone_number | string  | Participant phone number             |
| has_won      | boolean | Indicates if participant won         |

---

## 3. Get Expedition List

### GET /expedition/list

### Description
Returns list of all available expeditions.

### Request
No body.

### Response
```json
{
  "list": [
    {
      "id": 1,
      "name": "Atucha"
    },
    {
      "id": 2,
      "name": "Embalse"
    }
  ]
}
```

### Response Schema

| Field | Type   | Description          |
|-------|--------|----------------------|
| list  | array  | List of expeditions  |
| id    | number | Expedition ID        |
| name  | string | Expedition name      |

---

## 4. Create Expedition

### POST /expedition

### Description
Creates a new expedition.

### Request Body
```json
{
  "name": "Nueva Expedición"
}
```

### Response
```json
{
  "id": 3,
  "name": "Nueva Expedición"
}
```

### Response Schema

| Field | Type   | Description          |
|-------|--------|----------------------|
| id    | number | New expedition ID    |
| name  | string | Expedition name      |

---

## 5. Get Participant by Name

### GET /participant

### Description
Returns participant data and expedition history.

### Request Body
```json
{
  "first_name": "string",
  "last_name": "string"
}
```

### Response
```json
{
  "participant": {
    "first_name": "string",
    "last_name": "string",
    "census": 123456,
    "career": "string"
  },
  "historial": [
    {
      "expedition": "string",
      "year": 2026
    }
  ]
}
```

---

## 6. Get Participant by Census

### GET /participant/census

### Description
Returns participant data and expedition history using census number.

### Request Body
```json
{
  "census": 123456
}
```

### Response
```json
{
  "participant": {
    "first_name": "string",
    "last_name": "string",
    "census": 123456,
    "career": "string"
  },
  "historial": [
    {
      "expedition": "string",
      "year": 2026
    }
  ]
}
```

---

## 7. Rate Participants

### POST /rate

### Description
Calculates a score for each participant based on their expedition history. Used before executing lottery to weight participants.

### Request Body
```json
{
  "expedition": "string",
  "year": 2026,
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 123456,
      "career": "string",
      "phone_number": "string",
      "has_ig_req": true
    }
  ]
}
```

### Request Fields

| Field        | Type    | Required | Description                                     |
|--------------|---------|----------|-------------------------------------------------|
| expedition   | string  | yes      |                                                 |
| year         | number  | yes      |                                                 |
| list         | array   | yes      |                                                 |
| first_name   | string  | yes      |                                                 |
| last_name    | string  | yes      |                                                 |
| census       | number  | yes      |                                                 |
| career       | string  | yes      |                                                 |
| phone_number | string  | yes      |                                                 |
| has_ig_req   | boolean | yes      | True if Excel has Instagram column with content |

### Response
```json
{
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 123456,
      "career": "string",
      "phone_number": "string",
      "score": 100
    }
  ]
}
```

### Response Schema

| Field        | Type   | Description                               |
|--------------|--------|-------------------------------------------|
| list         | array  | List of participants with scores          |
| first_name   | string | Participant first name                    |
| last_name    | string | Participant last name                     |
| census       | number | Student registry number                   |
| career       | string | Career name                               |
| phone_number | string | Participant phone number                  |
| score        | number | Calculated score (higher = more priority) |

---

## 8. Execute Lottery

### POST /lottery

### Description
Executes a weighted lottery using pre-scored participants and returns participants with updated has_won flag.

### Request Body
```json
{
  "count": 5,
  "expedition": "string",
  "year": 2026,
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 123456,
      "career": "string",
      "phone_number": "string",
      "score": 100
    }
  ]
}
```

### Request Fields

| Field        | Type   | Required | Description                        |
|--------------|--------|----------|------------------------------------|
| count        | number | yes      | Number of winners to select        |
| expedition   | string | yes      | Expedition name                    |
| year         | number | yes      | Expedition year                    |
| list         | array  | yes      | Scored participants from /rate     |
| score        | number | yes      | Pre-calculated score from /rate    |

### Response
```json
{
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 123456,
      "career": "string",
      "phone_number": "string",
      "has_won": true
    }
  ]
}
```

---

## 9. Insert Participants

### POST /insert

### Description
Inserts or updates participants and expedition history after lottery execution.

### Request Body
```json
{
  "expedition": "string",
  "year": 2026,
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 123456,
      "career": "string",
      "phone_number": "string",
      "has_won": true
    }
  ]
}
```

### Response
```json
{
  "inserted": 10,
  "repeated": 2,
  "total": 12
}
```

### Response Schema

| Field    | Type   | Description                              |
|----------|--------|------------------------------------------|
| inserted | number | Number of newly inserted participants    |
| repeated | number | Number of participants already in system |
| total    | number | Total participants processed             |

---

## Error Handling (All Endpoints)

### Standard Error Response
```json
{
  "detail": "Error description"
}
```

### Common HTTP Status Codes

| Code | Meaning                 |
|------|-------------------------|
| 200  | Success                 |
| 400  | Validation error        |
| 404  | Not found               |
| 500  | Internal server error   |

---

## Notes for Frontend Implementation

- All requests must use Content-Type: application/json
- Use async/await for all calls
- Validate required fields before sending requests
- Handle non-200 responses explicitly
- Workflow for sortout: Upload Excel → POST /rate → POST /lottery → POST /insert
- The score field is calculated by /rate and consumed by /lottery
- Boolean field has_won is returned by /lottery, /insert, and /expedition
