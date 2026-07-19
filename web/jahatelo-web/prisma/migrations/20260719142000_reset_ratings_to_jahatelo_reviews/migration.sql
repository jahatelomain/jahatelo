-- Las calificaciones de Jahatelo se calculan únicamente desde Review.
-- Esto elimina los valores históricos importados desde Google Maps.
UPDATE "Motel" AS motel
SET
  "ratingAvg" = COALESCE(review_summary."ratingAvg", 0),
  "ratingCount" = COALESCE(review_summary."ratingCount", 0)
FROM (
  SELECT
    "motelId",
    AVG("score")::double precision AS "ratingAvg",
    COUNT(*)::integer AS "ratingCount"
  FROM "Review"
  WHERE "motelId" IS NOT NULL
  GROUP BY "motelId"
) AS review_summary
WHERE motel."id" = review_summary."motelId";

UPDATE "Motel" AS motel
SET
  "ratingAvg" = 0,
  "ratingCount" = 0
WHERE NOT EXISTS (
  SELECT 1
  FROM "Review" AS review
  WHERE review."motelId" = motel."id"
);
