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

## Schedule Microservice

These endpoints allow scheduling class visits by crossing people's availability with career schedules.

---

## 10. Get Careers

### GET /careers

### Description
Returns list of all available careers.

### Request
No body.

### Response
```json
{
  "list": [
    {"career_id": 0, "career": "Agrimensura"},
    {"career_id": 1, "career": "Alimentos"},
    {"career_id": 6, "career": "Informática"}
  ]
}
```

### Response Schema

| Field     | Type   | Description     |
|-----------|--------|-----------------|
| list      | array  | List of careers |
| career_id | number | Career ID       |
| career    | string | Career name     |

---

## 11. Get Availability

### GET /availability

### Description
Returns availability of people for scheduling.

### Query Parameters

| Parameter | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| build     | string | no       | Filter by building (`PC`, `LH`, `CU`)    |

### Response
```json
{
  "list": [
    {"person": "Juan", "day": "Lunes", "starts_at": 10, "finishes_at": 13, "build": "PC"},
    {"person": "María", "day": "Martes", "starts_at": 8, "finishes_at": 12, "build": "LH"}
  ]
}
```

### Response Schema

| Field       | Type   | Description                     |
|-------------|--------|---------------------------------|
| list        | array  | List of availability entries    |
| person      | string | Person name                     |
| day         | string | Day of the week                 |
| starts_at   | number | Start hour                      |
| finishes_at | number | End hour                        |
| build       | string | Building code (`PC`, `LH`, `CU`)|

---

## 12. Get Subjects

### GET /subjects

### Description
Returns subjects for a specific career.

### Query Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| career_id | number | yes      | Career ID   |

### Response
```json
{
  "list": [
    {"subject": "Análisis I", "curse_type": "teorica", "day": "Lunes", "starts_at": 8, "room": "407", "build": "PC"},
    {"subject": "Física I", "curse_type": "practica", "day": "Martes", "starts_at": 10, "room": "209", "build": "LH"}
  ]
}
```

### Response Schema

| Field      | Type   | Description                                              |
|------------|--------|----------------------------------------------------------|
| list       | array  | List of subjects                                         |
| subject    | string | Subject name                                             |
| curse_type | string | Class type (`teorica`, `practica`, `teorica-practica`)   |
| day        | string | Day of the week                                          |
| starts_at  | number | Start hour                                               |
| room       | string | Room number                                              |
| build      | string | Building code (`PC`, `LH`, `CU`)                         |

---

## 13. Calculate Schedule

### POST /schedule

### Description
Crosses people's availability with career schedules to determine which classes can be covered and by whom.

### Request Body
```json
{
  "career_id": 6,
  "course_type": ["teorica", "practica", "teorica-practica"],
  "build": null,
  "min_responsibles": 2
}
```

### Request Fields

| Field            | Type         | Required | Description                                                        |
|------------------|--------------|----------|--------------------------------------------------------------------|
| career_id        | number       | yes      | Career ID (obtain from `/careers`)                                 |
| course_type      | array        | yes      | Class types to include: `teorica`, `practica`, `teorica-practica`  |
| build            | string\|null | no       | Filter by building (`PC`, `LH`, `CU`) or `null` for all            |
| min_responsibles | number       | no       | Minimum responsibles required to include a class (default: 2)      |

### Response
```json
{
  "list": [
    {
      "subject": "Análisis I",
      "curse_type": "teorica",
      "day": "Lunes",
      "starts_at": 8,
      "room": "407",
      "build": "PC",
      "responsibles": ["Juan", "María"]
    }
  ]
}
```

### Response Schema

| Field        | Type   | Description                                              |
|--------------|--------|----------------------------------------------------------|
| list         | array  | List of classes with assigned responsibles               |
| subject      | string | Subject name                                             |
| curse_type   | string | Class type (`teorica`, `practica`, `teorica-practica`)   |
| day          | string | Day of the week                                          |
| starts_at    | number | Start hour                                               |
| room         | string | Room number                                              |
| build        | string | Building code (`PC`, `LH`, `CU`)                         |
| responsibles | array  | List of assigned responsible persons                     |

### Assignment Logic

A person is assigned as responsible for a class if:
- They are available on the same day and building as the class
- Their availability time matches the class start time (±1 hour)

Only classes meeting the minimum responsibles requirement are included in the response.

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
