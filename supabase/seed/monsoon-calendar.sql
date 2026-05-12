-- ═══════════════════════════════════════════════════════════════════
-- Seed: Monsoon Calendar (Historical Hyderabad rainfall data)
-- Used as IMD API substitute for surge forecasting
-- ═══════════════════════════════════════════════════════════════════

-- June
INSERT INTO monsoon_calendar (month, day, rainfall_mm, historical_complaint_multiplier) VALUES
  (6, 1, 5.2, 1.10), (6, 5, 12.0, 1.30), (6, 10, 18.5, 1.50),
  (6, 15, 25.0, 1.60), (6, 20, 30.2, 1.70), (6, 25, 22.0, 1.55),
  (6, 30, 15.0, 1.40);

-- July (Peak monsoon)
INSERT INTO monsoon_calendar (month, day, rainfall_mm, historical_complaint_multiplier) VALUES
  (7, 1, 35.0, 1.80), (7, 5, 45.2, 2.00), (7, 10, 52.0, 2.20),
  (7, 15, 60.5, 2.50), (7, 20, 55.0, 2.30), (7, 25, 48.0, 2.10),
  (7, 30, 40.0, 1.90);

-- August
INSERT INTO monsoon_calendar (month, day, rainfall_mm, historical_complaint_multiplier) VALUES
  (8, 1, 42.0, 2.00), (8, 5, 50.5, 2.20), (8, 10, 55.0, 2.30),
  (8, 15, 45.0, 2.00), (8, 20, 38.0, 1.80), (8, 25, 35.0, 1.70),
  (8, 30, 30.0, 1.60);

-- September
INSERT INTO monsoon_calendar (month, day, rainfall_mm, historical_complaint_multiplier) VALUES
  (9, 1, 28.0, 1.50), (9, 5, 35.0, 1.70), (9, 10, 40.2, 1.80),
  (9, 15, 32.0, 1.60), (9, 20, 25.0, 1.40), (9, 25, 20.0, 1.30),
  (9, 30, 15.0, 1.20);

-- October
INSERT INTO monsoon_calendar (month, day, rainfall_mm, historical_complaint_multiplier) VALUES
  (10, 1, 12.0, 1.15), (10, 5, 18.0, 1.30), (10, 10, 22.5, 1.40),
  (10, 15, 15.0, 1.25), (10, 20, 10.0, 1.10), (10, 25, 5.0, 1.05),
  (10, 30, 3.0, 1.00);

-- Non-monsoon months (minimal rainfall)
INSERT INTO monsoon_calendar (month, day, rainfall_mm, historical_complaint_multiplier) VALUES
  (1, 1, 0.0, 1.00), (2, 1, 0.5, 1.00), (3, 1, 1.0, 1.00),
  (4, 1, 2.0, 1.05), (5, 1, 3.0, 1.10), (11, 1, 2.0, 1.05),
  (12, 1, 0.5, 1.00);
