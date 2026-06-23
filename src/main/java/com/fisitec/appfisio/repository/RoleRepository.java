package com.fisitec.appfisio.repository;

import com.fisitec.appfisio.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository interface for Role entity.
 * Provides CRUD operations and custom queries for roles.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Find a role by its name.
     * @param name the role name (e.g., "ROLE_ADMIN")
     * @return Optional containing the role if found
     */
    Optional<Role> findByName(String name);
}