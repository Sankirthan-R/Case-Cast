CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('Citizen','Lawyer','Judge','Researcher') NOT NULL DEFAULT 'Citizen',
  phone         VARCHAR(20),
  address       TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE cases (
  case_id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL,
  age                 TINYINT UNSIGNED NOT NULL,
  sex                 ENUM('M','F') NOT NULL,
  priors_count        SMALLINT UNSIGNED NOT NULL,
  jail_days           INT UNSIGNED NOT NULL,
  juv_felony          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  juv_misdemeanor     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  juv_other           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  days_arrest_screen  INT NOT NULL,
  days_offense_screen INT NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_age CHECK (age BETWEEN 18 AND 100),
  CONSTRAINT fk_case_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_case_user_time (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE predictions (
  case_id          INT NOT NULL,
  task             ENUM('conviction','severity','recidivism') NOT NULL,
  probability      DECIMAL(5,4) NOT NULL,
  predicted_label  VARCHAR(30) NOT NULL,
  latency_ms       INT UNSIGNED,
  predicted_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (case_id, task),
  CONSTRAINT chk_prob CHECK (probability BETWEEN 0 AND 1),
  CONSTRAINT fk_pred_case FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  log_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NULL,
  action    VARCHAR(50) NOT NULL,
  details   VARCHAR(255),
  logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
  session_id CHAR(36) PRIMARY KEY,            
  user_id    INT NOT NULL,
  issued_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  user_agent VARCHAR(255),
  CONSTRAINT fk_sess_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_sess_user (user_id, issued_at)
) ENGINE=InnoDB;

