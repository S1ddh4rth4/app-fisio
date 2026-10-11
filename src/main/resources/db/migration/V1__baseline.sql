-- =============================================
-- V1__baseline.sql (VERSIÓN ORACLE)
-- Esquema inicial del sistema App Fisio
-- =============================================

-- Tabla de roles del sistema
CREATE TABLE roles (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(255) NOT NULL UNIQUE
);

-- Tabla de usuarios
CREATE TABLE users (
    id VARCHAR2(255) PRIMARY KEY,
    username VARCHAR2(255) NOT NULL UNIQUE,
    email VARCHAR2(255) NOT NULL UNIQUE,
    password VARCHAR2(255) NOT NULL,
    primary_physio_id VARCHAR2(255),
    enabled NUMBER(1,0) DEFAULT 1 NOT NULL,
    created_by VARCHAR2(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR2(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_physio FOREIGN KEY (primary_physio_id) REFERENCES users(id)
);

-- Tabla intermedia de roles de usuario (Many-to-Many)
CREATE TABLE user_roles (
    user_id VARCHAR2(255) NOT NULL,
    role_id NUMBER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Catálogo de tratamientos
CREATE TABLE treatments (
    id VARCHAR2(255) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL UNIQUE,
    description VARCHAR2(1000) NOT NULL,
    duration_minutes NUMBER NOT NULL,
    price NUMBER(10, 2) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Paquetes de sesiones de pacientes
CREATE TABLE patient_packages (
    id VARCHAR2(255) PRIMARY KEY,
    patient_id VARCHAR2(255) NOT NULL,
    package_name VARCHAR2(255) NOT NULL,
    total_sessions NUMBER NOT NULL,
    used_sessions NUMBER DEFAULT 0 NOT NULL,
    total_price NUMBER(38, 2) NOT NULL,
    payment_method VARCHAR2(255) NOT NULL,
    status VARCHAR2(255) DEFAULT 'ACTIVO' NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_pkg_patient FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- Citas (Actualizado con Auditoría y Tipo de Cita)
CREATE TABLE appointments (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id VARCHAR2(255) NOT NULL,
    professional_id VARCHAR2(255) NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    appointment_type VARCHAR2(50) DEFAULT 'VALORACION_INICIAL' NOT NULL,
    reason VARCHAR2(255),
    status VARCHAR2(255) NOT NULL,
    payment_status VARCHAR2(255) DEFAULT 'PENDIENTE' NOT NULL,
    payment_amount NUMBER(38, 2),
    payment_method VARCHAR2(255),
    patient_package_id VARCHAR2(255),
    created_by VARCHAR2(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR2(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_patient FOREIGN KEY (patient_id) REFERENCES users(id),
    CONSTRAINT fk_app_prof FOREIGN KEY (professional_id) REFERENCES users(id),
    CONSTRAINT fk_app_pkg FOREIGN KEY (patient_package_id) REFERENCES patient_packages(id)
);

-- Historias clínicas (Uso de CLOB)
CREATE TABLE clinical_histories (
    id VARCHAR2(255) PRIMARY KEY,
    patient_id VARCHAR2(255) NOT NULL,
    physiotherapist_id VARCHAR2(255) NOT NULL,
    record_number VARCHAR2(255) NOT NULL,
    evaluation_type VARCHAR2(255) NOT NULL,
    main_diagnosis VARCHAR2(500),
    pain_level NUMBER,
    form_data_json CLOB NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_ch_patient FOREIGN KEY (patient_id) REFERENCES users(id),
    CONSTRAINT fk_ch_physio FOREIGN KEY (physiotherapist_id) REFERENCES users(id)
);

-- Expedientes médicos
CREATE TABLE medical_records (
    id VARCHAR2(255) PRIMARY KEY,
    patient_id VARCHAR2(255) NOT NULL,
    physiotherapist_id VARCHAR2(255) NOT NULL,
    appointment_id NUMBER,
    diagnosis VARCHAR2(1000) NOT NULL,
    notes CLOB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_mr_patient FOREIGN KEY (patient_id) REFERENCES users(id),
    CONSTRAINT fk_mr_physio FOREIGN KEY (physiotherapist_id) REFERENCES users(id),
    CONSTRAINT fk_mr_app FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Prescripciones de ejercicios
CREATE TABLE exercise_prescriptions (
    id VARCHAR2(255) PRIMARY KEY,
    patient_id VARCHAR2(255) NOT NULL,
    physiotherapist_id VARCHAR2(255) NOT NULL,
    title VARCHAR2(255) NOT NULL,
    general_instructions CLOB,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR2(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_ep_patient FOREIGN KEY (patient_id) REFERENCES users(id),
    CONSTRAINT fk_ep_physio FOREIGN KEY (physiotherapist_id) REFERENCES users(id)
);

-- Items de prescripción
CREATE TABLE prescription_items (
    prescription_id VARCHAR2(255) NOT NULL,
    exercise_name VARCHAR2(255),
    sets NUMBER,
    repetitions VARCHAR2(255),
    frequency VARCHAR2(255),
    notes VARCHAR2(255),
    video_url VARCHAR2(255),
    CONSTRAINT fk_pi_presc FOREIGN KEY (prescription_id) REFERENCES exercise_prescriptions(id)
);