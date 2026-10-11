package com.fisitec.appfisio.service;

import com.fisitec.appfisio.entity.AuditLog;
import com.fisitec.appfisio.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Registra un evento de auditoría de forma segura.
     * 🎓 ARQUITECTURA: Usamos REQUIRES_NEW para asegurar que el registro de
     * vigilancia
     * se guarde de forma totalmente independiente. Así, si algo más falla en el
     * código,
     * el registro de auditoría jamás se borra ni se deshace (rollback).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String actorUsername, String action, String targetPatientId, String details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actorUsername(actorUsername)
                    .action(action)
                    .targetPatientId(targetPatientId)
                    .details(details)
                    .build();
            auditLogRepository.save(auditLog);
            log.info("VIGILANCIA (AUDIT LOG): '{}' hizo '{}' al expediente de '{}'", actorUsername, action,
                    targetPatientId);
        } catch (Exception e) {
            // Un fallo al guardar auditoría nunca debe "tirar" la aplicación principal
            log.error("Fallo crítico al intentar guardar registro de auditoría: {}", e.getMessage());
        }
    }
}