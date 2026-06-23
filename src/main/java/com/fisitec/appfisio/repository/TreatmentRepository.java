package com.fisitec.appfisio.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fisitec.appfisio.entity.Treatment;

@Repository
public interface TreatmentRepository extends JpaRepository<Treatment, String> {

    // Spring Boot escribirá la consulta SQL automáticamente por nosotros
    Optional<Treatment> findByName(String name);

    boolean existsByName(String name);
}
