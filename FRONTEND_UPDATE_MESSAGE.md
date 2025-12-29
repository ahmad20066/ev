# Frontend Update: Mark Exercise Done API

## Endpoint

`POST /fitness/exercise-done`

## What Changed

The `stats` field is now an **array of sets** (each set has a `weight`). Sets are numbered automatically based on array order.

## Request Body

```json
{
  "workout_id": 1,
  "exercise_id": 5,
  "stats": [
    { "weight": "50" },
    { "weight": "55" },
    { "weight": "60" }
  ]
}
```

## Response

Same as before: `{ "message": "Exercise Completed and Stats Recorded" }` (201 status)

