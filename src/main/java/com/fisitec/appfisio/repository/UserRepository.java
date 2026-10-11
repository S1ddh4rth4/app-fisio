package com.fisitec.appfisio.repository;

import com.fisitec.appfisio.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

/**
 * Repositorio Spring Data JPA para la entidad de Usuarios.
 * Gestiona consultas de identidad, roles de acceso y relaciones clínicas.
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    /**
     * Busca un usuario por su nombre de usuario único.
     */
    Optional<User> findByUsername(String username);

    /**
     * Busca un usuario por su dirección de correo electrónico.
     */
    Optional<User> findByEmail(String email);

    /**
     * Verifica la existencia de un nombre de usuario en la base de datos.
     */
    boolean existsByUsername(String username);

    /**
     * Verifica la existencia de un correo electrónico registrado.
     */
    boolean existsByEmail(String email);

    /**
     * Obtiene todos los usuarios que posean un rol específico (ej. ROLE_PACIENTE,
     * ROLE_FISIOTERAPEUTA).
     */
    List<User> findByRoles_Name(String roleName);

    /**
     * Cuenta el total de usuarios registrados bajo un rol determinado.
     */
    long countByRoles_Name(String roleName);

    /**
     * Encuentra todos los pacientes asignados a un fisioterapeuta específico.
     */
    List<User> findByPrimaryPhysio(User primaryPhysio);
}