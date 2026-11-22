CREATE VIEW v_user_history AS
SELECT c.case_id, c.user_id, c.age, c.sex, c.created_at,
       p.task, p.predicted_label, p.probability
FROM cases c JOIN predictions p USING (case_id);

DELIMITER //
CREATE TRIGGER trg_case_audit AFTER INSERT ON cases FOR EACH ROW
BEGIN
  INSERT INTO audit_logs(user_id, action, details)
  VALUES (NEW.user_id, 'PREDICT', CONCAT('case ', NEW.case_id));
END//

CREATE PROCEDURE sp_user_summary(IN p_user INT)
BEGIN
  SELECT COUNT(DISTINCT c.case_id) AS total_cases,
         AVG(CASE WHEN p.task='recidivism' THEN p.probability END) AS avg_recid_risk,
         MAX(c.created_at) AS last_prediction
  FROM cases c LEFT JOIN predictions p USING (case_id)
  WHERE c.user_id = p_user;
END//
DELIMITER ;