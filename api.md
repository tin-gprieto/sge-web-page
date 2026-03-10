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

### Query Parameters

| Parameter  | Type   | Required | Description        |
|------------|--------|----------|--------------------|
| expedition | string | yes      | Expedition name    |
| year       | number | yes      | Expedition year    |

### Response
```json
{
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 123456,
      "career": "string",
      "has_won": true
    }
  ]
}
```

### Response Schema

| Field      | Type    | Description                  |
|------------|---------|------------------------------|
| list       | array   | List of participants         |
| first_name | string  | Participant first name       |
| last_name  | string  | Participant last name        |
| census     | number  | Student registry number      |
| career     | string  | Career name                  |
| has_won    | boolean | Indicates if participant won |

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

## 4. Get Expedition Historial

### GET /expedition/historial

### Description
Returns list of all unique (expedition name, year) pairs that have been completed. Used for validation and cascading selection in the UI.

### Request
No body.

### Response
```json
{
  "list": [
    {
      "name": "Atucha",
      "year": 2025
    },
    {
      "name": "Embalse",
      "year": 2024
    }
  ]
}
```

### Response Schema

| Field | Type   | Description                         |
|-------|--------|-------------------------------------|
| list  | array  | List of completed expedition/years  |
| name  | string | Expedition name                     |
| year  | number | Year the expedition was completed   |

---

## 5. Create Expedition

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

## 6. Get Participant by Name

### GET /participant

### Description
Returns participant data and expedition history.

### Query Parameters

| Parameter  | Type   | Required | Description            |
|------------|--------|----------|------------------------|
| first_name | string | yes      | Participant first name |
| last_name  | string | yes      | Participant last name  |

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

## 7. Get Participant by Census

### GET /participant/census

### Description
Returns participant data and expedition history using census number.

### Query Parameters

| Parameter | Type   | Required | Description              |
|-----------|--------|----------|--------------------------|
| census    | number | yes      | Student registry number  |

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

## 8. Get All Participants

### GET /participants

### Description
Returns the complete list of all participants registered in the system with their name, census and career.

### Request
No body.

### Response
```json
{
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 108765,
      "career": "string"
    }
  ]
}
```

### Response Schema

| Field      | Type   | Description                        |
|------------|--------|------------------------------------|
| list       | array  | List of participants               |
| first_name | string | Participant first name             |
| last_name  | string | Participant last name              |
| census     | int?   | Census number (may be null)        |
| career     | string | Career name                        |

---

## 9. Rate Participants

### POST /rate

### Description
Calculates a score for each participant based on their expedition history. Used before executing lottery to weight participants.

> **Note:** 
> - The `census` field is required. If `census` is not available, `document` (optional) will be used. If neither is provided, the participant will be accepted in the request but removed from processing and will not appear in the response.
> - Both `census` and `document` are validated against the FIUBA database. If no match is found or they don't coincide, the participant will be removed from processing.
> - The `first_name`, `last_name` and `tipo_nro_documento` fields are obtained from the FIUBA table using `census` or `document` as `tipo_nro_documento` if necessary (consider all documents as DNI type).

### Request Body
```json
{
  "expedition": "string",
  "year": 2026,
  "list": [
    {
      "census": 123456,
      "document": 42123123,
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
| expedition   | string  | yes      | Expedition name                                 |
| year         | number  | yes      | Expedition year                                 |
| list         | array   | yes      | List of participants                            |
| census       | number  | yes*     | Student registry (required if no document)      |
| document     | number  | no       | DNI number (optional, used if no census)        |
| career       | string  | yes      | Career name                                     |
| phone_number | string  | yes      | Participant phone number                        |
| has_ig_req   | boolean | yes      | True if Excel has Instagram column with content |

### Response
```json
{
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 123456,
      "document": 42123123,
      "career": "string",
      "phone_number": "string",
      "score": 1.0
    }
  ]
}
```

### Response Schema

| Field        | Type   | Description                               |
|--------------|--------|-------------------------------------------|
| list         | array  | List of participants with scores          |
| first_name   | string | Participant first name (from FIUBA DB)    |
| last_name    | string | Participant last name (from FIUBA DB)     |
| census       | number | Student registry number                   |
| document     | number | DNI number                                |
| career       | string | Career name                               |
| phone_number | string | Participant phone number                  |
| score        | number | Calculated score (higher = more priority) |

### Scoring Rules

- **2**: Registered for the expedition lottery but was not selected
- **x2**: Met the Instagram requirement (`has_ig_req: true`) - multiplies base score by 2
- **1.5**: In the database but never went to any expedition
- **1**: Never came to any expedition (not found in database)
- **0.5**: Went to some expedition (different from the one being drawn)
- **0.25**: Already went to the expedition being drawn

---

## 10. Execute Lottery

### POST /lottery

### Description
Executes a weighted lottery using pre-scored participants and returns participants with updated has_won flag.

> **Note:** 
> - The `census` field is required. If `census` is not available, `document` (optional) will be used. If neither is provided, the participant will be accepted in the request but removed from processing and will not appear in the response.
> - Both `census` and `document` are validated against the FIUBA database. If no match is found or they don't coincide, the participant will be removed from processing.
> - The `first_name`, `last_name` and `tipo_nro_documento` fields are obtained from the FIUBA table using `census` or `document` as `tipo_nro_documento` if necessary (consider all documents as DNI type).

### Request Body
```json
{
  "count": 5,
  "expedition": "string",
  "year": 2026,
  "list": [
    {
      "census": 123456,
      "document": 42123123,
      "career": "string",
      "phone_number": "string",
      "score": 1.0
    }
  ]
}
```

### Request Fields

| Field        | Type   | Required | Description                           |
|--------------|--------|----------|---------------------------------------|
| count        | number | yes      | Number of winners to select           |
| expedition   | string | yes      | Expedition name                       |
| year         | number | yes      | Expedition year                       |
| list         | array  | yes      | Scored participants from /rate        |
| census       | number | yes*     | Student registry (required if no doc) |
| document     | number | no       | DNI number (optional)                 |
| career       | string | yes      | Career name                           |
| phone_number | string | yes      | Participant phone number              |
| score        | number | yes      | Pre-calculated score from /rate       |

### Response
```json
{
  "list": [
    {
      "first_name": "string",
      "last_name": "string",
      "census": 123456,
      "document": 42123123,
      "career": "string",
      "phone_number": "string",
      "has_won": true
    }
  ]
}
```

---

## 11. Insert Participants

### POST /insert

### Description
Inserts or updates participants and expedition history after lottery execution.

> **Note:** 
> - The `census` field is required. If `census` is not available, `document` (optional) will be used. If neither is provided, the participant will be accepted in the request but removed from processing and will not appear in the response.
> - Both `census` and `document` are validated against the FIUBA database. If no match is found or they don't coincide, the participant will be removed from processing.
> - If census is not found in FIUBA, `first_name` and `last_name` from the request body will be used as fallback.
> - Career matching is case-insensitive and accent-insensitive (ignores tildes like "ó", "í").

### Request Body
```json
{
  "expedition": "string",
  "year": 2026,
  "list": [
    {
      "census": 123456,
      "document": 42123123,
      "first_name": "Juan",
      "last_name": "Pérez",
      "career": "string",
      "phone_number": "string",
      "has_won": true
    }
  ]
}
```

### Request Fields

| Field        | Type    | Required | Description                                     |
|--------------|---------|----------|-------------------------------------------------|
| expedition   | string  | yes      | Expedition name                                 |
| year         | number  | yes      | Expedition year                                 |
| list         | array   | yes      | List of participants                            |
| census       | number  | yes*     | Student registry (required if no document)      |
| document     | number  | no       | DNI number (optional, used if no census)        |
| first_name   | string  | no       | First name (fallback if not in FIUBA)           |
| last_name    | string  | no       | Last name (fallback if not in FIUBA)            |
| career       | string  | no       | Career name (optional)                          |
| phone_number | string  | no       | Participant phone number (optional)             |
| has_won      | boolean | yes      | Lottery result                                  |

### Response
```json
{
  "inserted": 10,
  "repeated": 2,
  "skipped": 1,
  "total": 13,
  "list": [
    {
      "first_name": "Juan",
      "last_name": "Pérez",
      "census": 123456,
      "career": "Ing. Informática",
      "has_won": true
    }
  ]
}
```

### Response Schema

| Field    | Type   | Description                              |
|----------|--------|------------------------------------------|
| inserted | number | Number of newly inserted participants    |
| repeated | number | Number of participants already in system |
| skipped  | number | Number of participants skipped (invalid career or not in FIUBA) |
| total    | number | Total participants in original request   |
| list     | array  | List of inserted/updated participants    |

### InsertedParticipant Schema

| Field      | Type    | Description                  |
|------------|---------|------------------------------|
| first_name | string  | Participant first name       |
| last_name  | string  | Participant last name        |
| census     | number  | Student registry number      |
| career     | string  | Career name                  |
| has_won    | boolean | Indicates if participant won |

---

## Schedule Microservice

These endpoints allow scheduling class visits by crossing people's availability with career schedules.

---

## 12. Get Careers

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

## 13. Get Availability

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

## 14. Get Subjects

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

## 15. Calculate Schedule

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
