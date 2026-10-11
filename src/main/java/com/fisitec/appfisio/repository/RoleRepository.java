package com.fisitec.appfisio.repository;

import com.fisitec.appfisio.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad de Roles y Permisos.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Busca un rol por su nombre oficial (ej. "ROLE_ADMIN", "ROLE_FISIOTERAPEUTA",
     * "ROLE_PACIENTE").
     */
    Optional<Role> findByName(String name);
}