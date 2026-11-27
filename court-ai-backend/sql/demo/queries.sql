USE casecast;

-- 1. VIEW + ORDER BY: a user's prediction history
SELECT * FROM v_user_history WHERE user_id = 2 ORDER BY created_at DESC LIMIT 9;

-- 2. THREE-TABLE JOIN + AGGREGATE: average recidivism risk per user
SELECT u.user_id, u.full_name, u.role, COUNT(*) AS cases, ROUND(AVG(p.probability),3) AS avg_recid_risk
FROM users u
JOIN cases c ON c.user_id = u.user_id
JOIN predictions p ON p.case_id = c.case_id
WHERE p.task = 'recidivism'
GROUP BY u.user_id, u.full_name, u.role
ORDER BY avg_recid_risk DESC LIMIT 5;

-- 3. GROUP BY + HAVING: busiest users (check SELECT user_id, COUNT(*) FROM cases GROUP BY user_id first and adjust 15)
SELECT u.email, COUNT(*) AS n
FROM cases c JOIN users u USING (user_id)
GROUP BY u.user_id HAVING n >= 15;

-- 4. CASE expression + aggregate: recidivism risk by age band
SELECT CASE WHEN c.age < 25 THEN '<25' WHEN c.age < 40 THEN '25-39' ELSE '40+' END AS band,
       ROUND(AVG(p.probability),3) AS avg_risk, COUNT(*) AS n
FROM cases c JOIN predictions p USING (case_id)
WHERE p.task = 'recidivism' GROUP BY band;

-- 5. CORRELATED SUBQUERY: predictions above the average for their own task
SELECT p.case_id, p.task, p.probability
FROM predictions p
WHERE p.probability > (SELECT AVG(p2.probability) FROM predictions p2 WHERE p2.task = p.task)
ORDER BY p.task, p.probability DESC LIMIT 10;

-- 6. SCALAR SUBQUERY: cases above the overall recidivism average
SELECT case_id, probability FROM predictions
WHERE task = 'recidivism'
  AND probability > (SELECT AVG(probability) FROM predictions WHERE task = 'recidivism')
LIMIT 10;

-- 7. WINDOW FUNCTION: rank users by activity
SELECT user_id, COUNT(*) AS n, RANK() OVER (ORDER BY COUNT(*) DESC) AS rnk
FROM cases GROUP BY user_id;

-- 8. CTE + WINDOW (PARTITION BY): top 3 highest-risk predictions per task
WITH ranked AS (
  SELECT case_id, task, probability,
         RANK() OVER (PARTITION BY task ORDER BY probability DESC) AS rnk
  FROM predictions)
SELECT * FROM ranked WHERE rnk <= 3 ORDER BY task, rnk;

-- 9. CTE + RUNNING TOTAL: daily cases and cumulative growth
WITH daily AS (SELECT DATE(created_at) AS d, COUNT(*) AS n FROM cases GROUP BY d)
SELECT d, n, SUM(n) OVER (ORDER BY d) AS running_total FROM daily;

-- 10. LEFT JOIN anti-join: users with no cases
SELECT u.email FROM users u LEFT JOIN cases c USING (user_id) WHERE c.case_id IS NULL;

-- 11. AGGREGATE: inference latency per task
SELECT task, ROUND(AVG(latency_ms),1) AS avg_ms, MAX(latency_ms) AS max_ms FROM predictions GROUP BY task;

-- 12. SESSIONS: active sessions per user (GROUP BY + JOIN)
SELECT u.email, COUNT(*) AS active_sessions
FROM user_sessions s JOIN users u USING (user_id)
WHERE s.revoked_at IS NULL AND s.issued_at > NOW() - INTERVAL 12 HOUR
GROUP BY u.user_id ORDER BY active_sessions DESC;

-- 13. SESSIONS + HAVING: users with more than one concurrent session
SELECT user_id, COUNT(*) AS n FROM user_sessions WHERE revoked_at IS NULL GROUP BY user_id HAVING n > 1;

-- 14. TRIGGER EVIDENCE: audit entries written automatically
SELECT action, COUNT(*) AS n FROM audit_logs GROUP BY action;

-- 15. STORED PROCEDURE
CALL sp_user_summary(2);

-- 16. TRANSACTION: delete, check, roll back (cascade removes predictions inside the transaction too)
SELECT COUNT(*) AS before_cnt FROM cases;
START TRANSACTION;
DELETE FROM cases WHERE case_id = 1;
SELECT COUNT(*) AS inside_txn FROM cases;
ROLLBACK;
SELECT COUNT(*) AS after_rollback FROM cases;

