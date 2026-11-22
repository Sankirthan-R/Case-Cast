-- JOIN + ORDER: a user's history
SELECT * FROM v_user_history WHERE user_id = 1 ORDER BY created_at DESC;

-- GROUP BY / HAVING
SELECT u.email, COUNT(*) n FROM cases c JOIN users u USING (user_id)
GROUP BY u.user_id HAVING n > 5;

-- Aggregate with CASE: recidivism risk by age band
SELECT CASE WHEN c.age<25 THEN '<25' WHEN c.age<40 THEN '25-39' ELSE '40+' END band,
       ROUND(AVG(p.probability),3) avg_risk, COUNT(*) n
FROM cases c JOIN predictions p USING (case_id)
WHERE p.task='recidivism' GROUP BY band;

-- Correlated subquery: cases above the average risk
SELECT p.case_id, p.probability FROM predictions p
WHERE p.task='recidivism'
  AND p.probability > (SELECT AVG(probability) FROM predictions WHERE task='recidivism');

-- Window: rank users by activity
SELECT user_id, COUNT(*) n, RANK() OVER (ORDER BY COUNT(*) DESC) rnk FROM cases GROUP BY user_id;

-- CTE + running total
WITH daily AS (SELECT DATE(created_at) d, COUNT(*) n FROM cases GROUP BY d)
SELECT d, n, SUM(n) OVER (ORDER BY d) running_total FROM daily;

-- Latency per task
SELECT task, AVG(latency_ms) avg_ms, MAX(latency_ms) max_ms FROM predictions GROUP BY task;

-- LEFT JOIN: users with no predictions
SELECT u.email FROM users u LEFT JOIN cases c USING (user_id) WHERE c.case_id IS NULL;

-- Call the procedure
CALL sp_user_summary(1);

-- Index demo: compare before and after
EXPLAIN SELECT * FROM cases WHERE user_id = 1 ORDER BY created_at DESC;

-- Transaction demo
START TRANSACTION;
DELETE FROM cases WHERE case_id = 1;
ROLLBACK;