package com.fisitec.appfisio.repository;

import com.fisitec.appfisio.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {

    // Para cuando el Administrador quiera auditar a un paciente específico
    List<AuditLog> findByTargetPatientIdOrderByTimestampDesc(String targetPatientId);

    // Para cuando queramos investigar a un fisioterapeuta sospechoso
    List<AuditLog> findByActorUsernameOrderByTimestampDesc(String actorUsername);
}