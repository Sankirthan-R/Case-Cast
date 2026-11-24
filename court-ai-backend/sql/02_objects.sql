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

DELIMITER //
CREATE TRIGGER trg_session_login AFTER INSERT ON user_sessions FOR EACH ROW
BEGIN
  INSERT INTO audit_logs(user_id, action, details)
  VALUES (NEW.user_id, 'LOGIN', CONCAT('session ', NEW.session_id));
END//

CREATE TRIGGER trg_session_logout AFTER UPDATE ON user_sessions FOR EACH ROW
BEGIN
  IF OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
    INSERT INTO audit_logs(user_id, action, details)
    VALUES (NEW.user_id, 'LOGOUT', CONCAT('session ', NEW.session_id));
  END IF;
END//
DELIMITER ;

